import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Editor, { OnMount } from '@monaco-editor/react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { PlayIcon, Loader2, SparklesIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import ReactMarkdown from 'react-markdown';
import type { editor } from 'monaco-editor'; // Import the specific editor type

const popularLanguages = [
  'javascript', 'typescript', 'python', 'java', 'c', 'c++', 'csharp', 'go', 'rust', 'r'
];

const languageToMonacoId: { [key: string]: string } = {
  'c++': 'cpp', 'csharp': 'csharp', 'typescript': 'typescript',
};

const defaultCodeSnippets: { [key: string]: string } = {
  javascript: 'console.log("Hello from JavaScript!");',
  typescript: 'console.log("Hello from TypeScript!");',
  python: 'print("Hello from Python!")',
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java!");\n    }\n}',
  c: '#include <stdio.h>\n\nint main() {\n   printf("Hello from C!");\n   return 0;\n}',
  'c++': '#include <iostream>\n\nint main() {\n    std::cout << "Hello from C++!";\n    return 0;\n}',
  'csharp': 'using System;\n\nclass Program {\n    static void Main(string[] args) {\n        Console.WriteLine("Hello from C#!");\n    }\n}',
  rust: 'fn main() {\n    println!("Hello from Rust!");\n}',
  go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello from Go!")\n}',
  r: 'print("Hello from R!")',
};

interface Runtime {
  language: string;
  version: string;
  aliases: string[];
}

type WebSocketMessage = {
    type: 'session_load' | 'code_update' | 'language_change';
    data?: {
        code: string;
        selectedRuntimeIndex: string;
    };
    code?: string;
    selectedRuntimeIndex?: string;
}

export default function Session() {
  const { sessionId } = useParams();
  const [code, setCode] = useState('// Loading session...');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [runtimes, setRuntimes] = useState<Runtime[]>([]);
  const [selectedRuntimeIndex, setSelectedRuntimeIndex] = useState('0');
  const [selectedRuntimeObject, setSelectedRuntimeObject] = useState<Runtime | null>(null);
  const ws = useRef<WebSocket | null>(null);
  // --- FIXED: Use the specific type for the editor instance ---
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    async function fetchRuntimes() {
      try {
        const response = await fetch('https://emkc.org/api/v2/piston/runtimes');
        const allRuntimes: Runtime[] = await response.json();
        const filteredRuntimes = popularLanguages.map(lang => allRuntimes.find(r => r.language === lang)).filter(Boolean);
        setRuntimes(filteredRuntimes as Runtime[]);
      } catch (error) {
        console.error("Failed to fetch runtimes:", error);
      }
    }
    fetchRuntimes();
  }, []);

  useEffect(() => {
    if (runtimes.length === 0) return;

    ws.current = new WebSocket('ws://localhost:3001');
    ws.current.onopen = () => ws.current?.send(JSON.stringify({ type: 'join', sessionId }));
    
    ws.current.onmessage = (event) => {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      switch (message.type) {
        case 'session_load': {
          if (message.data) {
            const { code, selectedRuntimeIndex } = message.data;
            setCode(code || `// Welcome to the session!`);
            if (selectedRuntimeIndex && runtimes[parseInt(selectedRuntimeIndex)]) {
              setSelectedRuntimeIndex(selectedRuntimeIndex);
              setSelectedRuntimeObject(runtimes[parseInt(selectedRuntimeIndex)]);
            }
          }
          break;
        }
        case 'code_update': {
          if (typeof message.code === 'string') {
            setCode(message.code);
          }
          break;
        }
        case 'language_change': {
          const { selectedRuntimeIndex } = message; 
          if (selectedRuntimeIndex && runtimes[parseInt(selectedRuntimeIndex)]) {
            setSelectedRuntimeIndex(selectedRuntimeIndex);
            setSelectedRuntimeObject(runtimes[parseInt(selectedRuntimeIndex)]);
          }
          break;
        }
      }
    };
    
    return () => ws.current?.close();
  }, [sessionId, runtimes]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    editor.onDidChangeCursorSelection(() => {
        const selection = editor.getSelection();
        if (selection && !selection.isEmpty()) {
            const text = editor.getModel()?.getValueInRange(selection);
            setSelectedText(text || '');
        } else {
            setSelectedText('');
        }
    });
  };

  const handleEditorChange = (value?: string) => {
    const newCode = value || '';
    setCode(newCode);
    ws.current?.send(JSON.stringify({ type: 'code_update', code: newCode, sessionId }));
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput('');
    if (!selectedRuntimeObject) {
      setOutput('Error: No language selected.');
      setIsRunning(false);
      return;
    }
    const { language, version } = selectedRuntimeObject;
    try {
      const response = await fetch('http://localhost:3001/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, version, code }),
      });
      const result = await response.json();
      if (response.ok && result.run) {
        setOutput(result.run.stdout || result.run.stderr || 'Code executed with no output.');
      } else {
        setOutput(`Error: ${result.message || 'An unknown error occurred.'}`);
      }
    } catch (error) {
      console.error('Error executing code:', error);
      setOutput('An error occurred while trying to execute the code.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleExplainCode = async () => {
    if (!selectedText || !selectedRuntimeObject) return;

    setIsExplaining(true);
    setOutput('🧠 AI is thinking...');
    const { language } = selectedRuntimeObject;

    try {
        const response = await fetch('http://localhost:3001/explain-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: selectedText, language }),
        });
        const result = await response.json();
        if (response.ok) {
            setOutput(result.explanation);
        } else {
            setOutput(`Error: ${result.error || 'An unknown error occurred.'}`);
        }
    } catch (error) {
        console.error('Error explaining code:', error);
        setOutput('An error occurred while trying to get an explanation.');
    } finally {
        setIsExplaining(false);
    }
  };

  const handleLanguageChange = (indexStr: string) => {
    const index = parseInt(indexStr);
    const runtime = runtimes[index];
    if (runtime) {
      setSelectedRuntimeIndex(indexStr);
      setSelectedRuntimeObject(runtime);
      setCode(defaultCodeSnippets[runtime.language] || `// Start typing in ${runtime.language}`);
      ws.current?.send(JSON.stringify({ type: 'language_change', sessionId, selectedRuntimeIndex: indexStr }));
    }
  };

  const currentLanguageForEditor = useMemo(() => {
    if (!selectedRuntimeObject) return 'javascript';
    return languageToMonacoId[selectedRuntimeObject.language] || selectedRuntimeObject.language;
  }, [selectedRuntimeObject]);

  return (
    <main className="h-screen bg-background flex flex-col">
      <Helmet><title>Coding Session | CollabCode AI</title></Helmet>
      <header className="p-2 border-b flex-shrink-0 flex items-center justify-between gap-4">
        <h1 className="text-lg font-bold truncate">Session: {sessionId}</h1>
        <div className="flex items-center gap-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="language-select">Language</Label>
            <Select value={selectedRuntimeIndex} onValueChange={handleLanguageChange} disabled={runtimes.length === 0}>
              <SelectTrigger id="language-select" className="w-[220px]">
                <SelectValue placeholder="Select Language" />
              </SelectTrigger>
              <SelectContent>
                {runtimes.map((runtime, index) => (
                  <SelectItem key={`${runtime.language}-${runtime.version}`} value={String(index)}>
                    {runtime.language} ({runtime.version})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 self-end">
            {selectedText && (
                <Button onClick={handleExplainCode} disabled={isExplaining} variant="outline" size="sm">
                    {isExplaining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SparklesIcon className="mr-2 h-4 w-4" />}
                    Explain
                </Button>
            )}
            <Button onClick={handleRunCode} disabled={isRunning || runtimes.length === 0}>
              {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayIcon className="mr-2 h-4 w-4" />}
              {isRunning ? 'Running...' : 'Run'}
            </Button>
          </div>
        </div>
      </header>
      
      <PanelGroup direction="vertical" className="flex-grow">
        <Panel defaultSize={70} minSize={20}>
          <Editor
            height="100%"
            language={currentLanguageForEditor}
            theme="vs-dark"
            value={code}
            onMount={handleEditorDidMount}
            onChange={handleEditorChange}
          />
        </Panel>
        <PanelResizeHandle className="h-2 bg-muted-foreground/20 hover:bg-muted-foreground/40 transition-colors" />
        <Panel defaultSize={30} minSize={10}>
          <div className="h-full bg-[#1e1e1e] text-white font-mono p-4 overflow-auto">
            <h2 className="text-lg font-semibold mb-2 border-b border-gray-600">Output</h2>
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown>{output}</ReactMarkdown>
            </div>
          </div>
        </Panel>
      </PanelGroup>
    </main>
  );
}
