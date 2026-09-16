import { bacaJson, jawab, jawabGalat } from "@/lib/api-server";
import { periksaPin } from "@/lib/pin";

/** Cek PIN sebelum membuka panel kelola (tanpa mengubah data apa pun). */
export async function POST(request: Request) {
  const isi = await bacaJson(request);
  const hasil = periksaPin(typeof isi.pin === "string" ? isi.pin : request.headers.get("x-app-pin"));

  if (!hasil.ok) return jawabGalat(hasil.pesan, hasil.status);
  return jawab({ pesan: "PIN benar." });
}
