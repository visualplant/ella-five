import Board from "@/components/Board";
import { defaultVertical } from "@/lib/verticals";
export const metadata = { alternates: { canonical: "/" } };
export default function Home() { return <Board v={defaultVertical} />; }
