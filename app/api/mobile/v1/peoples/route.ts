import type { NextRequest } from "next/server";
import { peoples } from "@/app/lib/peoples";
import { absoluteMediaUrl } from "../../_lib/dto";
import { ok } from "../../_lib/response";

export async function GET(request: NextRequest) {
  return ok(peoples.map(person => ({
    id: person.id,
    name: person.name,
    description: person.description,
    population: person.population,
    region: person.region,
    cover: absoluteMediaUrl(request.nextUrl.origin, person.photos[0]),
  })));
}
