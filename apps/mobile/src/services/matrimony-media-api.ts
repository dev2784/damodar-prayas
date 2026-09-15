import { API_BASE_URL, api } from '@/services/api';
import type { MatrimonyKundali, MatrimonyOwnerPhoto } from '@/services/matrimony-api';

export type UploadableFile = {
  uri: string;
  name: string;
  type: string;
};

function asFormData(file: UploadableFile) {
  const formData = new FormData();
  formData.append('file', file as unknown as Blob);
  return formData;
}

export async function uploadMatrimonyMediaFile({
  profileId,
  kind,
  file,
  accessToken,
}: {
  profileId: string;
  kind: 'photo' | 'kundali';
  file: UploadableFile;
  accessToken: string;
}) {
  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob);

  const suffix = kind === 'photo' ? 'photos' : 'kundali';
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/media/matrimony/${profileId}/${suffix}`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
        accept: 'application/json',
      },
      body: formData,
    });
  } catch (error) {
    throw { status: 'FETCH_ERROR', data: { error: 'UPLOAD_NETWORK_ERROR', message: String(error) } };
  }

  const raw = await response.text();
  let data: unknown = {};
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = { message: raw };
    }
  }

  if (!response.ok) {
    throw { status: response.status, data };
  }

  return data;
}

export const matrimonyMediaApi = api.injectEndpoints({
  endpoints: (builder) => ({
    uploadMatrimonyPhoto: builder.mutation<{ photo: MatrimonyOwnerPhoto }, { profileId: string; file: UploadableFile }>({
      query: ({ profileId, file }) => ({
        url: `/media/matrimony/${profileId}/photos`,
        method: 'POST',
        body: asFormData(file),
      }),
      invalidatesTags: (_result, _error, { profileId }) => [
        { type: 'Matrimony', id: profileId },
        { type: 'Matrimony', id: 'MINE' },
      ],
    }),
    deleteMatrimonyPhoto: builder.mutation<void, { profileId: string; photoId: string }>({
      query: ({ profileId, photoId }) => ({
        url: `/media/matrimony/${profileId}/photos/${photoId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { profileId }) => [
        { type: 'Matrimony', id: profileId },
        { type: 'Matrimony', id: 'MINE' },
      ],
    }),
    setPrimaryMatrimonyPhoto: builder.mutation<{ photo: MatrimonyOwnerPhoto }, { profileId: string; photoId: string }>({
      query: ({ profileId, photoId }) => ({
        url: `/media/matrimony/${profileId}/photos/${photoId}/primary`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { profileId }) => [
        { type: 'Matrimony', id: profileId },
        { type: 'Matrimony', id: 'MINE' },
      ],
    }),
    uploadMatrimonyKundali: builder.mutation<{ kundali: MatrimonyKundali }, { profileId: string; file: UploadableFile }>({
      query: ({ profileId, file }) => ({
        url: `/media/matrimony/${profileId}/kundali`,
        method: 'POST',
        body: asFormData(file),
      }),
      invalidatesTags: (_result, _error, { profileId }) => [
        { type: 'Matrimony', id: profileId },
        { type: 'Matrimony', id: 'MINE' },
      ],
    }),
    deleteMatrimonyKundali: builder.mutation<void, { profileId: string; kundaliId: string }>({
      query: ({ profileId, kundaliId }) => ({
        url: `/media/matrimony/${profileId}/kundali/${kundaliId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { profileId }) => [
        { type: 'Matrimony', id: profileId },
        { type: 'Matrimony', id: 'MINE' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useUploadMatrimonyPhotoMutation,
  useDeleteMatrimonyPhotoMutation,
  useSetPrimaryMatrimonyPhotoMutation,
  useUploadMatrimonyKundaliMutation,
  useDeleteMatrimonyKundaliMutation,
} = matrimonyMediaApi;
