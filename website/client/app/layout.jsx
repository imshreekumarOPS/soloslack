import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import { AppProviders } from "@/components/providers/AppProviders";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
    title: "Notban | Notes + Kanban",
    description: "A hybrid tool for notes and task management.",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={`${inter.className} bg-surface-base text-text-primary antialiased`}>
                <AppProviders>
                    <div className="flex h-screen overflow-hidden">
                        <Sidebar />
                        <main className="flex-1 overflow-auto relative bg-surface-base">
                            {children}
                        </main>
                    </div>
                </AppProviders>
            </body>
        </html>
    );
}
