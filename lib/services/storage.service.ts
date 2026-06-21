import { supabase } from "../supabase/client";

export async function uploadProductImage(file: File) {
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
    const fileName = `Products/${Date.now()}-${safeName}`;

    const {data, error} = await supabase.storage
    .from("products-bucket")
    .upload(fileName, file, {
        upsert: true,
    });

    if (error) throw error;

    const { data: urlData } = supabase.storage.from("products-bucket")
    .getPublicUrl(fileName);

    return urlData.publicUrl;
}

export async function uploadProductImages(files: File[]) {
    const uploadPromises = files.map(file => uploadProductImage(file));
    return Promise.all(uploadPromises);
}