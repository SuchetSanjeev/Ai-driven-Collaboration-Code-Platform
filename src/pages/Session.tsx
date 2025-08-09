import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Helmet } from 'react-helmet-async';

export default function Session() {
  const { sessionId } = useParams();
  const [code, setCode] = useState('// Welcome to your collaborative session!');
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:3001');

    ws.current.onopen = () => {
      console.log('Connected to WebSocket server');
      ws.current?.send(JSON.stringify({ type: 'join', sessionId }));
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'code_update') {
        setCode(data.code);
      }
    };

    return () => {
      ws.current?.close();
    };
  }, [sessionId]);

  const handleEditorChange = (value?: string) => {
    const newCode = value || '';
    setCode(newCode);
    ws.current?.send(JSON.stringify({ type: 'code_update', code: newCode }));
  };

  return (
    // The main container needs to have a fixed height for the child to fill
    <main className="h-screen bg-background flex flex-col">
      <Helmet>
        <title>Coding Session | CollabCode AI</title>
      </Helmet>
      <header className="p-4 border-b flex-shrink-0">
        <h1 className="text-xl font-bold">Session ID: {sessionId}</h1>
        <p className="text-sm text-muted-foreground">Happy coding!</p>
      </header>
      {/* This is the crucial part. 
        'flex-1' makes the div take up all available space.
        'min-h-0' is a fix for a common flexbox issue where the child
        (the editor) overflows its container.
      */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          theme="vs-dark"
          value={code}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false }
          }}
        />
      </div>
    </main>
  );
}
