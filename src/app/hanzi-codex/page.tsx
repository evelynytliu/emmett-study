import { HanziCodexLab } from "@/components/hanzi-codex-lab";
import { hanziSets } from "@/content/hanzi";

export default function HanziCodexPage() {
  return (
    <div className="flex flex-1 flex-col py-8">
      <HanziCodexLab sets={hanziSets} />
    </div>
  );
}
