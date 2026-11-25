import Board from "@/components/Board";
import { defaultVertical } from "@/lib/verticals";
import { SITE_URL } from "@/lib/data";
import { HOME_TITLE, HOME_DESCRIPTION } from "@/lib/seo";

export const metadata = {
  title: { absolute: HOME_TITLE },
  description: HOME_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { type: "website" as const, url: SITE_URL, title: HOME_TITLE, description: HOME_DESCRIPTION },
  twitter: { card: "summary_large_image" as const, title: HOME_TITLE, description: HOME_DESCRIPTION },
};

export default function Home() { return <Board v={defaultVertical} />; }
