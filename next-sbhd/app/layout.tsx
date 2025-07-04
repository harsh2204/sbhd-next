import Link from "next/link";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Somebody Has Died - Estate Inheritance Game",
  description: "A loose-ly inspired version of the Someone Has Died game",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen funeral-text">
        <main className="min-h-screen">{children}</main>
        <footer className="py-6 text-center border-t border-funeral-gold/20 bg-funeral-black/50 backdrop-blur-sm">
          <div className="funeral-container">
            <p className="text-funeral-silver text-sm">
              {"Crafted with ⚱️ by "}
              <Link
                href={"https://www.harshgupta.dev"}
                className="text-funeral-gold hover:text-funeral-bronze transition-colors duration-300 font-semibold"
              >
                Harsh Gupta
              </Link>
              {" • Inspired by "}
              <Link
                href={"https://www.someonehasdiedgame.com"}
                className="text-funeral-gold hover:text-funeral-bronze transition-colors duration-300 font-semibold"
              >
                Someone Has Died
              </Link>
            </p>
            <p className="text-funeral-silver/70 text-xs mt-2 font-style italic">
              "In death, we find the most amusing arguments about life"
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
