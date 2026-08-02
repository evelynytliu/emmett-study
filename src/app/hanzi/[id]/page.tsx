import { notFound } from "next/navigation";
import { getHanziSet, hanziSets } from "@/content/hanzi";
import { HanziPlayer } from "@/components/hanzi-player";

export function generateStaticParams() {
  return hanziSets.map((s) => ({ id: s.id }));
}

export default function HanziPage({ params }: { params: { id: string } }) {
  const set = getHanziSet(params.id);
  if (!set) notFound();
  return <HanziPlayer set={set} />;
}
