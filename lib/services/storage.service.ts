import { supabase } from "../supabase/client";

export async function uploadProductImage(file: File) {
    const fileName = `Products/${file.name}`;

    const {data, error} = await supabase.storage
    .from("products-bucket")
    .upload(fileName, file);

    if (error) throw error;

    const { data: urlData } = supabase.storage.from("products-bucket")
    .getPublicUrl(fileName);

    return urlData.publicUrl;
}