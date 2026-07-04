"use client";

import { GoogleSheetsCdbsProvider } from "./google-sheets-provider";
import { LocalCdbsProvider } from "./local-provider";
import type { CdbsProvider, MediaInput, MediaItem } from "./types";

export type { CdbsProvider, MediaInput, MediaItem };

const localProvider = new LocalCdbsProvider(
  process.env.NEXT_PUBLIC_CDBS_LOCAL_STORAGE_KEY || "artclass_media_v2"
);

const requestedProvider =
  process.env.NEXT_PUBLIC_CDBS_PROVIDER || "google-sheets";

const remoteProvider: CdbsProvider | null =
  requestedProvider === "google-sheets"
    ? new GoogleSheetsCdbsProvider()
    : null;

class CdbsService implements CdbsProvider {
  readonly name = remoteProvider?.name || localProvider.name;
  readonly isRemote = Boolean(remoteProvider);

  async getMedia(): Promise<MediaItem[]> {
    if (!remoteProvider) {
      return localProvider.getMedia();
    }

    try {
      return await remoteProvider.getMedia();
    } catch (error) {
      console.error("CDBS remote fetch failed. Falling back to local data:", error);
      return localProvider.getMedia();
    }
  }

  async addMedia(item: MediaInput): Promise<MediaItem> {
    if (!remoteProvider) {
      return localProvider.addMedia(item);
    }

    try {
      return await remoteProvider.addMedia(item);
    } catch (error) {
      console.error("CDBS remote add failed. Saving locally:", error);
      return localProvider.addMedia(item);
    }
  }

  async updateMedia(
    id: string,
    updatedFields: Partial<MediaItem>
  ): Promise<MediaItem> {
    if (remoteProvider && !id.startsWith("local-")) {
      try {
        return await remoteProvider.updateMedia(id, updatedFields);
      } catch (error) {
        console.error("CDBS remote update failed:", error);
      }
    }

    return localProvider.updateMedia(id, updatedFields);
  }

  async deleteMedia(id: string): Promise<boolean> {
    if (remoteProvider && !id.startsWith("local-")) {
      try {
        return await remoteProvider.deleteMedia(id);
      } catch (error) {
        console.error("CDBS remote delete failed:", error);
      }
    }

    return localProvider.deleteMedia(id);
  }

  async incrementView(id: string): Promise<void> {
    if (remoteProvider && !id.startsWith("local-")) {
      try {
        await remoteProvider.incrementView(id);
        return;
      } catch (error) {
        console.error("CDBS remote view increment failed:", error);
      }
    }

    await localProvider.incrementView(id);
  }

  async incrementDownload(id: string): Promise<void> {
    if (remoteProvider && !id.startsWith("local-")) {
      try {
        await remoteProvider.incrementDownload(id);
        return;
      } catch (error) {
        console.error("CDBS remote download increment failed:", error);
      }
    }

    await localProvider.incrementDownload(id);
  }
}

export const cdbsService = new CdbsService();
export const dbService = cdbsService;
export const cdbsStatus = {
  provider: cdbsService.name,
  isRemote: cdbsService.isRemote,
  requestedProvider,
};
