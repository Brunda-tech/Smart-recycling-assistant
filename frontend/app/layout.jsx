import './globals.css';

export const metadata = {
  title: 'Smart Recycling Assistant',
  description: 'AI-powered waste segregation and circular economy dashboard',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
