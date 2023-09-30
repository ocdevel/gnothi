import {fields_list_response} from "@gnothi/schemas/fields.ts";
import {UseFormProps, UseFormReturn} from "react-hook-form";
import {create} from "zustand";

interface UpsertStore {
  field?: fields_list_response
  setField: (field: fields_list_response) => void
  form?: UseFormReturn<fields_list_response>
  setForm: (form: UseFormProps<fields_list_response>) => void
}

export const useUpsertStore = create<UpsertStore>((set, get) => ({
  field: undefined,
  setField: (field) => set({field}),
  form: undefined,
  setForm: (form) => set({form})
}));