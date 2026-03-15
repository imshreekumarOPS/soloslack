import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import { AppProviders } from "@/components/providers/AppProviders";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
    title: "SoloSlack",
    description: "A hybrid tool for notes and task management.",
    icons: {
        icon: '/soloslack_icon_preview.svg',
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                try {
                                    var theme = localStorage.getItem('theme') || 'dark';
                                    if (theme === 'dark') {
                                        document.documentElement.classList.add('dark');
                                    } else {
                                        document.documentElement.classList.remove('dark');
                                    }
                                    document.documentElement.style.colorScheme = theme;
                                } catch (e) {}
                            })();
                        `,
                    }}
                />
            </head>
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
