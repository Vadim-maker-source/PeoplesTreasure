import type { NextRequest } from "next/server";
import { peoples } from "@/app/lib/peoples";
import { absoluteMediaUrl, publicOrigin } from "../../../_lib/dto";
import { fail, ok } from "../../../_lib/response";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const person = peoples.find(item => item.id === id);
  if (!person) return fail("Народ не найден", 404, "NOT_FOUND");
  const origin = publicOrigin(request);
  return ok({
    ...person,
    photos: person.photos.map(value => absoluteMediaUrl(origin, value)),
    photoFood: person.photoFood.map(value => absoluteMediaUrl(origin, value)),
    suitPhoto: person.suitPhoto.map(value => absoluteMediaUrl(origin, value)),
  });
}
