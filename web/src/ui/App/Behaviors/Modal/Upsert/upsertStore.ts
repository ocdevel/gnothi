import {fields_list_response, fields_post_request} from "@gnothi/schemas/fields.ts";
import {UseFormProps, UseFormReturn} from "react-hook-form";
import {create} from "zustand";
import {useForm} from "react-hook-form";


interface UpsertStore {
  field?: fields_list_response
  setField: (field: fields_list_response) => void
  form?: UseFormReturn<fields_post_request>
  setForm: (form: UseFormReturn<fields_post_request>) => void
}

export const useUpsertStore = create<UpsertStore>((set, get) => ({
  field: undefined,
  setField: (field) => set({field}),
  form: undefined,
  setForm: (form) => set({form})
}));