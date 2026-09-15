import { api } from '@/services/api';
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
