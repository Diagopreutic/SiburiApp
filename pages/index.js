import Head from "next/head";
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the SiburiApp (client-only)
const DynamicSiburiApp = dynamic(() => import('../components/SiburiApp'), {
  ssr: false,
  loading: () => <p>Loading Color Picker...</p>
});

export default function Home() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div>
      <Head>
        <title>SiburiApp</title>
        <meta name="description" content="Generateds value of a colour selected" />
        <link rel="icon" href="/DPT.jpg" />
      </Head>

      <main style={{ fontFamily: 'Arial, sans-serif' }}>
        {/*<h1 style={{ textAlign: 'center', color: '#333' }}>
          Color Picker
        </h1>*/}

        {isClient ? <DynamicSiburiApp /> : <p>Loading color picker...</p>}
      </main>
    </div>
  );
}
