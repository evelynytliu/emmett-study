import { notFound } from "next/navigation";
import { getPrep, preps } from "@/content/prep";
import { PrepPlayer } from "@/components/prep-player";

export function generateStaticParams() {
  return preps.map((p) => ({ id: p.id }));
}

export default function PrepPage({ params }: { params: { id: string } }) {
  const prep = getPrep(params.id);
  if (!prep) notFound();
  return <PrepPlayer prep={prep} />;
}
