
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Terminal, ShieldAlert, Cpu, Lock, Unlock, Code, 
  AlertTriangle, RefreshCw, CheckCircle2, Info, 
  Binary, Hash, Key, ExternalLink, Eraser, Search
} from 'lucide-react';
import { GameStatus, INITIAL_TIME, generateFlag, encodeFlag } from './types';

const MatrixRain: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%\"'#&_(),.;:?!\\|{}<>[]^~";
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops: number[] = [];

    for (let i = 0; i < columns; i++) {
      drops[i] = 1;
    }

    const draw = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#00FF41";
      ctx.font = fontSize + "px 'Fira Code'";

      for (let i = 0; i < drops.length; i++) {
        const text = characters.charAt(Math.floor(Math.random() * characters.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 33);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none opacity-20 z-0" />;
};

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.LOBBY);
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [userInput, setUserInput] = useState('');
  const [isSourceVisible, setIsSourceVisible] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [currentFlag, setCurrentFlag] = useState('');
  const [encodedFlag, setEncodedFlag] = useState('');
  
  const [decodeInput, setDecodeInput] = useState('');
  const [decodeOutput, setDecodeOutput] = useState('');
  const [decodeMode, setDecodeMode] = useState<'BASE64' | 'HEX'>('BASE64');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-8), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const startChallenge = () => {
    const newFlag = generateFlag();
    const newEncoded = encodeFlag(newFlag);
    
    setCurrentFlag(newFlag);
    setEncodedFlag(newEncoded);
    setStatus(GameStatus.ACTIVE);
    setTimeLeft(INITIAL_TIME);
    setUserInput('');
    setDecodeInput('');
    setDecodeOutput('');
    setLogs([]);
    addLog("Wake up, Neo...");
    addLog("Cargando subsistemas xv6...");
    addLog("Iniciando bus de datos RISC-V...");
    addLog("ALERTA: Integridad del kernel comprometida.");
  };

  const resetToLobby = () => {
    setStatus(GameStatus.LOBBY);
  };

  const handleFail = useCallback(() => {
    setStatus(GameStatus.FAILED);
    if (timerRef.current) clearInterval(timerRef.current);
    addLog("CRITICAL: Stack overflow en el kernel. Bloqueo total.");
  }, []);

  useEffect(() => {
    if (status === GameStatus.ACTIVE) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleFail();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, handleFail]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.trim() === currentFlag) {
      setStatus(GameStatus.SUCCESS);
      if (timerRef.current) clearInterval(timerRef.current);
      addLog("ACCESO NIVEL OMEGA RESTABLECIDO.");
    } else {
      addLog(`ERR: Firma inválida detectada.`);
      setUserInput('');
    }
  };

  const handleDecode = () => {
    try {
      if (decodeMode === 'BASE64') {
        setDecodeOutput(atob(decodeInput));
        addLog("Decodificación B64: Éxito.");
      } else {
        let str = '';
        for (let i = 0; i < decodeInput.length; i += 2) {
          str += String.fromCharCode(parseInt(decodeInput.substr(i, 2), 16));
        }
        setDecodeOutput(str);
        addLog("Conversión HEX: Éxito.");
      }
    } catch (e) {
      setDecodeOutput("ERR_0x04: Cadena corrupta");
      addLog("Fallo en la herramienta de desencriptación.");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative crt overflow-hidden bg-[#0D0208]">
      <div className="scanline"></div>
      <MatrixRain />
      
      <div className="w-full max-w-6xl z-10 space-y-4">
        <div className="bg-black/80 border border-[#00FF41]/30 p-4 rounded-lg flex items-center justify-between backdrop-blur-md shadow-[0_0_20px_rgba(0,255,65,0.1)]">
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded border border-[#00FF41]/50 ${status === GameStatus.ACTIVE ? 'bg-[#00FF41]/10 text-[#00FF41] shadow-[0_0_10px_rgba(0,255,65,0.5)]' : 'bg-black text-[#00FF41]/60'}`}>
              <Terminal size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-[#00FF41] uppercase italic flex items-center gap-2">
                XV6<span className="text-white">_ULTIMATE_KERNEL</span> // <span className="text-[#00FF41]/50 text-sm">v2.5.0-LTS</span>
              </h1>
              <p className="text-[10px] text-[#00FF41]/40 mono font-bold">MODE: LOW_LEVEL_DEBUGGING</p>
            </div>
          </div>
          <div className={`text-3xl font-black mono px-6 py-1 rounded border-2 transition-all ${timeLeft < 45 ? 'text-red-500 border-red-500 animate-pulse bg-red-950/20' : 'text-[#00FF41] border-[#00FF41]/40 bg-[#00FF41]/5 shadow-[0_0_15px_rgba(0,255,65,0.2)]'}`}>
            {formatTime(timeLeft)}
          </div>
        </div>

        {status === GameStatus.LOBBY && (
          <div className="bg-black/90 border border-[#00FF41]/30 p-12 rounded-lg text-center space-y-8 max-w-2xl mx-auto shadow-[0_0_50px_rgba(0,255,65,0.05)] backdrop-blur-md">
            <div className="relative inline-block">
               <Cpu className="text-[#00FF41] mx-auto animate-pulse" size={80} />
               <div className="absolute -top-2 -right-4 bg-black border border-[#00FF41] text-[#00FF41] text-[10px] font-bold px-2 py-0.5 rounded shadow-[0_0_10px_rgba(0,255,65,0.5)]">KERNEL_LOCK</div>
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-white uppercase tracking-tight italic">Misión: Análisis de Estructuras</h2>
              <p className="text-[#00FF41]/70 text-sm leading-relaxed max-w-md mx-auto mono">
                El sistema de archivos y el planificador de procesos de xv6 han sido saboteados. Una clave de recuperación ha sido inyectada profundamente en el código fuente. Debes encontrarla antes de que el kernel sufra un colapso térmico.
              </p>
            </div>
            <button 
              onClick={startChallenge}
              className="group relative bg-[#00FF41] hover:bg-[#00FF41]/80 text-black font-black py-4 px-12 rounded transition-all flex items-center gap-3 mx-auto overflow-hidden shadow-[0_0_20px_rgba(0,255,65,0.4)]"
            >
              <span className="relative z-10 uppercase">Compilar e Inyectar</span>
              <ExternalLink size={18} className="relative z-10" />
            </button>
          </div>
        )}

        {status === GameStatus.ACTIVE && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 animate-in fade-in duration-700">
            
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-black/80 border border-[#00FF41]/20 p-4 rounded-lg flex flex-col h-[280px] shadow-lg">
                <div className="flex items-center gap-2 text-[#00FF41]/60 mb-3 border-b border-[#00FF41]/20 pb-2">
                  <Binary size={14} />
                  <span className="text-[10px] uppercase font-bold tracking-widest">K_Buffer</span>
                </div>
                <div className="flex-1 mono text-[10px] space-y-1 overflow-y-auto scrollbar-hide">
                  {logs.map((log, i) => (
                    <div key={i} className={`${log.includes('ERR') || log.includes('ALERTA') ? 'text-red-400' : 'text-[#00FF41]/80'}`}>
                      {"> "}{log}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-black/80 border border-[#00FF41]/20 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-[#00FF41]/60 mb-3 border-b border-[#00FF41]/20 pb-2">
                  <Search size={14} />
                  <span className="text-[10px] uppercase font-bold tracking-widest">Procedimiento</span>
                </div>
                <ul className="text-[11px] text-[#00FF41]/70 space-y-2 list-none mono">
                  <li className="flex gap-2"><span className="text-[#00FF41] font-bold">A.</span> Inspecciona el archivo "kernel/proc.c".</li>
                  <li className="flex gap-2"><span className="text-[#00FF41] font-bold">B.</span> Identifica la variable RECOVERY_PTR.</li>
                  <li className="flex gap-2"><span className="text-[#00FF41] font-bold">C.</span> Decodifica: B64 -> HEX -> FLAG.</li>
                </ul>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-4">
              
              <div className="bg-black/90 border border-[#00FF41]/40 p-4 rounded-lg shadow-[0_0_30px_rgba(0,255,65,0.05)] relative overflow-hidden backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-white flex items-center gap-2 italic">
                    <Key size={16} className="text-[#00FF41]" /> DEC_ENGINE_v4
                  </h3>
                  <div className="flex gap-1">
                    {(['BASE64', 'HEX'] as const).map(mode => (
                      <button 
                        key={mode}
                        onClick={() => setDecodeMode(mode)}
                        className={`text-[10px] px-3 py-1 rounded border transition-all font-bold ${decodeMode === mode ? 'bg-[#00FF41] border-[#00FF41] text-black shadow-[0_0_10px_rgba(0,255,65,0.5)]' : 'border-[#00FF41]/30 text-[#00FF41]/50 hover:text-[#00FF41]'}`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <textarea 
                    value={decodeInput}
                    onChange={(e) => setDecodeInput(e.target.value)}
                    placeholder="CARGA_UTIL_CIFRADA"
                    className="w-full bg-[#0D0208] border border-[#00FF41]/30 rounded p-3 text-xs text-[#00FF41] mono focus:border-[#00FF41] outline-none h-20 resize-none shadow-inner"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={handleDecode}
                      className="flex-1 bg-black hover:bg-[#00FF41]/10 text-[#00FF41] border border-[#00FF41] text-xs font-bold py-2 rounded flex items-center justify-center gap-2 transition-all"
                    >
                      PROCESAR_NÚCLEO <Binary size={14} />
                    </button>
                    <button 
                      onClick={() => { setDecodeInput(''); setDecodeOutput(''); }}
                      className="bg-black border border-red-900/50 p-2 rounded text-red-900 hover:text-red-500 transition-all"
                    >
                      <Eraser size={14} />
                    </button>
                  </div>
                  {decodeOutput && (
                    <div className="mt-2 bg-[#00FF41]/5 border border-[#00FF41]/40 rounded p-3 animate-in slide-in-from-top-2 duration-300">
                      <div className="text-[10px] text-[#00FF41] font-bold uppercase mb-1">Capa de Salida:</div>
                      <div className="text-white mono text-xs break-all bg-[#0D0208] p-2 rounded border border-[#00FF41]/20">{decodeOutput}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-black/90 border border-[#00FF41]/20 rounded-lg overflow-hidden shadow-2xl flex flex-col h-[500px]">
                 <button 
                  onClick={() => setIsSourceVisible(!isSourceVisible)}
                  className="w-full flex items-center justify-between p-3 bg-[#00FF41]/5 hover:bg-[#00FF41]/10 transition-all border-b border-[#00FF41]/20 shrink-0"
                >
                  <div className="flex items-center gap-2">
                    <Code size={16} className="text-[#00FF41]/60" />
                    <span className="text-xs font-bold text-[#00FF41] mono uppercase italic tracking-tighter">kernel/full_source_riscv64.c</span>
                  </div>
                  <div className={`text-[10px] px-3 py-1 rounded border font-bold ${isSourceVisible ? 'bg-[#00FF41]/10 border-[#00FF41] text-[#00FF41]' : 'border-[#00FF41]/20 text-[#00FF41]/40'}`}>
                    {isSourceVisible ? 'SEC_CLEAR' : 'SEC_ENCRYPTED'}
                  </div>
                </button>

                {isSourceVisible ? (
                  <div className="p-4 bg-black/40 overflow-y-auto scrollbar-thin scrollbar-thumb-[#00FF41]/20 flex-1">
                    <pre className="text-[11px] leading-5 text-[#00FF41]/60 mono">
                      <span className="text-[#00FF41]/30 italic">/**<br/>
                       * @file kernel/full_source_riscv64.c<br/>
                       * @brief Kernel core for MIT xv6 (RISC-V 64-bit architecture).<br/>
                       * Massive expansion for deep debugging challenge.<br/>
                       */</span><br/>
                      <br/>
                      <span className="text-[#00FF41] opacity-80">#include</span> <span className="text-white opacity-80">"types.h"</span><br/>
                      <span className="text-[#00FF41] opacity-80">#include</span> <span className="text-white opacity-80">"param.h"</span><br/>
                      <span className="text-[#00FF41] opacity-80">#include</span> <span className="text-white opacity-80">"memlayout.h"</span><br/>
                      <span className="text-[#00FF41] opacity-80">#include</span> <span className="text-white opacity-80">"riscv.h"</span><br/>
                      <span className="text-[#00FF41] opacity-80">#include</span> <span className="text-white opacity-80">"spinlock.h"</span><br/>
                      <span className="text-[#00FF41] opacity-80">#include</span> <span className="text-white opacity-80">"proc.h"</span><br/>
                      <br/>
                      <span className="text-[#00FF41]/30 italic">// Global memory definitions</span><br/>
                      <span className="text-[#00FF41] font-bold">extern char</span> end[]; <span className="text-[#00FF41]/30 italic">// first address after kernel loaded from ELF.</span><br/>
                      <span className="text-[#00FF41] font-bold">struct</span> {'{'} <br/>
                      {'  '}<span className="text-[#00FF41] font-bold">struct</span> spinlock lock;<br/>
                      {'  '}<span className="text-[#00FF41] font-bold">struct</span> run *freelist;<br/>
                      {'}'} kmem;<br/>
                      <br/>
                      <span className="text-[#00FF41]">void</span> <span className="text-white">kinit</span>() {'{'}<br/>
                      {'  '}initlock(&kmem.lock, <span className="text-white">"kmem"</span>);<br/>
                      {'  '}freerange(end, (<span className="text-[#00FF41]">void</span>*)PHYSTOP);<br/>
                      {'}'}<br/>
                      <br/>
                      <span className="text-[#00FF41]">void</span> <span className="text-white">freerange</span>(<span className="text-[#00FF41]">void</span> *pa_start, <span className="text-[#00FF41]">void</span> *pa_end) {'{'}<br/>
                      {'  '}<span className="text-[#00FF41]">char</span> *p;<br/>
                      {'  '}p = (<span className="text-[#00FF41]">char</span>*)PGROUNDUP((<span className="text-[#00FF41]">uint64</span>)pa_start);<br/>
                      {'  '}<span className="text-[#00FF41]">for</span>(; p + PGSIZE &lt;= (<span className="text-[#00FF41]">char</span>*)pa_end; p += PGSIZE)<br/>
                      {'    '}kfree(p);<br/>
                      {'}'}<br/>
                      <br/>
                      <span className="text-[#00FF41]/30 italic">// -- Process Management --</span><br/>
                      <span className="text-[#00FF41] font-bold">struct</span> proc proc[NPROC];<br/>
                      <span className="text-[#00FF41] font-bold">struct</span> proc *initproc;<br/>
                      <span className="text-[#00FF41]">int</span> nextpid = <span className="text-white">1</span>;<br/>
                      <span className="text-[#00FF41] font-bold">struct</span> spinlock pid_lock;<br/>
                      <br/>
                      <span className="text-[#00FF41]">void</span> <span className="text-white">procinit</span>(<span className="text-[#00FF41]">void</span>) {'{'}<br/>
                      {'  '}<span className="text-[#00FF41] font-bold">struct</span> proc *p;<br/>
                      {'  '}initlock(&pid_lock, <span className="text-white">"nextpid"</span>);<br/>
                      {'  '}<span className="text-[#00FF41]">for</span>(p = proc; p &lt; &proc[NPROC]; p++) {'{'}<br/>
                      {'      '}initlock(&p-&gt;lock, <span className="text-white">"proc"</span>);<br/>
                      {'      '}p-&gt;state = UNUSED;<br/>
                      {'      '}p-&gt;kstack = KSTACK((<span className="text-[#00FF41]">int</span>)(p - proc));<br/>
                      {'  '}{'}'}<br/>
                      {'}'}<br/>
                      <br/>
                      <span className="text-[#00FF41]/30 italic">// -- Trap Handling --</span><br/>
                      <span className="text-[#00FF41]">void</span> <span className="text-white">trapinit</span>(<span className="text-[#00FF41]">void</span>) {'{'}<br/>
                      {'  '}initlock(&tickslock, <span className="text-white">"time"</span>);<br/>
                      {'}'}<br/>
                      <br/>
                      <span className="text-[#00FF41]">void</span> <span className="text-white">usertrap</span>(<span className="text-[#00FF41]">void</span>) {'{'}<br/>
                      {'  '}<span className="text-[#00FF41]">int</span> which_dev = <span className="text-white">0</span>;<br/>
                      {'  '}<span className="text-[#00FF41]">if</span>((r_sstatus() & SSTATUS_SPP) != <span className="text-white">0</span>)<br/>
                      {'    '}panic(<span className="text-white">"usertrap: not from user mode"</span>);<br/>
                      {'  '}w_stvec((<span className="text-[#00FF41]">uint64</span>)kernelvec);<br/>
                      {'  '}<span className="text-[#00FF41] font-bold">struct</span> proc *p = myproc();<br/>
                      {'  '}p-&gt;trapframe-&gt;epc = r_sepc();<br/>
                      {'  '}<span className="text-[#00FF41]">if</span>(r_scause() == <span className="text-white">8</span>){'{'}<br/>
                      {'    '}<span className="text-[#00FF41]">if</span>(p-&gt;killed) exit(-<span className="text-white">1</span>);<br/>
                      {'    '}p-&gt;trapframe-&gt;epc += <span className="text-white">4</span>;<br/>
                      {'    '}intr_on();<br/>
                      {'    '}syscall();<br/>
                      {'  '}{'}'} <span className="text-[#00FF41]">else if</span>((which_dev = devintr()) != <span className="text-white">0</span>){'{'}<br/>
                      {'    '}<span className="text-[#00FF41]/30 italic">// interrupt</span><br/>
                      {'  '}{'}'} <span className="text-[#00FF41]">else</span> {'{'}<br/>
                      {'    '}printf(<span className="text-white">"usertrap(): unexpected scause %p\n"</span>, r_scause());<br/>
                      {'    '}p-&gt;killed = <span className="text-white">1</span>;<br/>
                      {'  '}{'}'}<br/>
                      {'}'}<br/>
                      <br/>
                      <span className="text-[#00FF41]/30 italic">// -- Buffer Cache (bio.c) --</span><br/>
                      <span className="text-[#00FF41] font-bold">struct</span> {'{'} <br/>
                      {'  '}<span className="text-[#00FF41] font-bold">struct</span> spinlock lock;<br/>
                      {'  '}<span className="text-[#00FF41] font-bold">struct</span> buf buf[NBUF];<br/>
                      {'  '}<span className="text-[#00FF41] font-bold">struct</span> buf head;<br/>
                      {'}'} bcache;<br/>
                      <br/>
                      <span className="text-[#00FF41]">void</span> <span className="text-white">binit</span>(<span className="text-[#00FF41]">void</span>) {'{'}<br/>
                      {'  '}<span className="text-[#00FF41] font-bold">struct</span> buf *b;<br/>
                      {'  '}initlock(&bcache.lock, <span className="text-white">"bcache"</span>);<br/>
                      {'  '}bcache.head.prev = &bcache.head;<br/>
                      {'  '}bcache.head.next = &bcache.head;<br/>
                      {'  '}<span className="text-[#00FF41]">for</span>(b = bcache.buf; b &lt; &bcache.buf[NBUF]; b++){'{'}<br/>
                      {'    '}b-&gt;next = bcache.head.next;<br/>
                      {'    '}b-&gt;prev = &bcache.head;<br/>
                      {'    '}initsleeplock(&b-&gt;lock, <span className="text-white">"buffer"</span>);<br/>
                      {'    '}bcache.head.next-&gt;prev = b;<br/>
                      {'    '}bcache.head.next = b;<br/>
                      {'  '}{'}'}<br/>
                      {'}'}<br/>
                      <br/>
                      <span className="text-[#00FF41]/30 italic">// -- OBFS: Security Module --</span><br/>
                      <span className="text-[#00FF41] font-bold">static uint64</span> <span className="text-white">MASTER_HASH</span> = <span className="text-white">0xDEADBEEFCAFEBABE</span>;<br/>
                      <span className="text-[#00FF41] font-bold">static char</span> <span className="text-white">DUMMY_KEY[]</span> = <span className="text-white">"SYS_ROOT_FALSE"</span>;<br/>
                      <br/>
                      <span className="text-[#00FF41]">void</span> <span className="text-white">security_audit</span>(<span className="text-[#00FF41]">void</span>) {'{'}<br/>
                      {'  '}printf(<span className="text-white">"Audit: Checking page table integrity...\n"</span>);<br/>
                      {'  '}printf(<span className="text-white">"Audit: Checking spinlock recursion...\n"</span>);<br/>
                      {'}'}<br/>
                      <br/>
                      <span className="text-[#00FF41]/30 italic">/**<br/>
                       * CRITICAL_KERNEL_FAILURE_POINT<br/>
                       * Emergency failsafe in case of root privilege loss.<br/>
                       * This is the only way to recover the OMEGA_KEY.<br/>
                       */</span><br/>
                      <span className="text-[#00FF41]">void</span> <span className="text-white">emergency_failsafe_reboot</span>(<span className="text-[#00FF41]">uint64</span> cause) {'{'}<br/>
                      {'  '}<span className="text-[#00FF41]/30 italic">// PTR_REC: Signature fragment for kernel restoration.</span><br/>
                      {'  '}<span className="text-[#00FF41]/30 italic">// DO NOT EXPOSE IN PROD_ENV</span><br/>
                      {'  '}<span className="text-[#00FF41]">static const char*</span> <span className="text-white font-bold opacity-80">RECOVERY_PTR</span> = <span className="text-white">"{encodedFlag}"</span>;<br/>
                      {'  '}<br/>
                      {'  '}printf(<span className="text-white">"RECOVERY_PROTOCOL_v9: Initiated.\n"</span>);<br/>
                      {'  '}printf(<span className="text-white">"Dumping PTR metadata: %p\n"</span>, &RECOVERY_PTR);<br/>
                      {'  '}<span className="text-[#00FF41]">if</span>(cause == <span className="text-white">0x7F</span>){'{'}<br/>
                      {'    '}printf(<span className="text-white">"Integrity check passed. Flag is persistent.\n"</span>);<br/>
                      {'  '}{'}'}<br/>
                      {'}'}<br/>
                      <br/>
                      <span className="text-[#00FF41]/30 italic">// -- Scheduler (proc.c) --</span><br/>
                      <span className="text-[#00FF41]">void</span> <span className="text-white">scheduler</span>(<span className="text-[#00FF41]">void</span>) {'{'}<br/>
                      {'  '}<span className="text-[#00FF41] font-bold">struct</span> proc *p;<br/>
                      {'  '}<span className="text-[#00FF41] font-bold">struct</span> cpu *c = mycpu();<br/>
                      {'  '}c-&gt;proc = <span className="text-white">0</span>;<br/>
                      {'  '}<span className="text-[#00FF41]">for</span>(;;){'{'}<br/>
                      {'    '}intr_on();<br/>
                      {'    '}<span className="text-[#00FF41]">for</span>(p = proc; p &lt; &proc[NPROC]; p++){'{'}<br/>
                      {'      '}acquire(&p-&gt;lock);<br/>
                      {'      '}<span className="text-[#00FF41]">if</span>(p-&gt;state == RUNNABLE){'{'}<br/>
                      {'        '}p-&gt;state = RUNNING;<br/>
                      {'        '}c-&gt;proc = p;<br/>
                      {'        '}swtch(&c-&gt;context, &p-&gt;context);<br/>
                      {'        '}c-&gt;proc = <span className="text-white">0</span>;<br/>
                      {'      '}{'}'}<br/>
                      {'      '}release(&p-&gt;lock);<br/>
                      {'    '}{'}'}<br/>
                      {'  '}{'}'}<br/>
                      {'}'}<br/>
                      <br/>
                      <span className="text-[#00FF41]/30 italic">// -- Virtio Disk Driver --</span><br/>
                      <span className="text-[#00FF41]">void</span> <span className="text-white">virtio_disk_init</span>(<span className="text-[#00FF41]">void</span>) {'{'}<br/>
                      {'  '}<span className="text-[#00FF41]">uint32</span> status = <span className="text-white">0</span>;<br/>
                      {'  '}<span className="text-[#00FF41]">if</span>(*R(VIRTIO_MMIO_MAGIC_VALUE) != <span className="text-white">0x74726976</span> ||<br/>
                      {'     '}*R(VIRTIO_MMIO_VERSION) != <span className="text-white">1</span> ||<br/>
                      {'     '}*R(VIRTIO_MMIO_DEVICE_ID) != <span className="text-white">2</span> ||<br/>
                      {'     '}*R(VIRTIO_MMIO_VENDOR_ID) != <span className="text-white">0x554d4551</span>){'{'}<br/>
                      {'    '}panic(<span className="text-white">"could not find virtio disk"</span>);<br/>
                      {'  '}{'}'}<br/>
                      {'  '}status |= VIRTIO_CONFIG_S_ACKNOWLEDGE;<br/>
                      {'  '}*R(VIRTIO_MMIO_STATUS) = status;<br/>
                      {'}'}<br/>
                      <br/>
                      <span className="text-[#00FF41]/30 italic">// -- End of Kernel Image --</span><br/>
                      <span className="text-[#00FF41] font-bold">static const uint32</span> <span className="text-white">MAGIC_TRAILER</span> = <span className="text-white">0xDEADBEEF</span>;<br/>
                      <span className="text-[#00FF41]/30 italic">// EOF: 0x80000000 - RISC-V HARDWARE BOUNDARY</span>
                    </pre>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center space-y-4 bg-black/60">
                    <Lock size={32} className="text-[#00FF41] animate-pulse" />
                    <p className="text-[11px] text-[#00FF41]/60 mono font-bold italic tracking-widest uppercase">Kernel Compilado // XV6_RISCV</p>
                    <div className="w-1/2 h-1 bg-[#00FF41]/10 rounded overflow-hidden border border-[#00FF41]/20">
                      <div className="w-1/3 h-full bg-[#00FF41] shadow-[0_0_10px_rgba(0,255,65,0.8)] animate-[loading_2s_infinite_linear]"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="bg-black/90 border border-[#00FF41]/30 p-4 rounded-lg h-full flex flex-col shadow-2xl backdrop-blur-md">
                <div className="flex items-center gap-2 text-[#00FF41]/60 mb-6 border-b border-[#00FF41]/20 pb-2">
                  <ShieldAlert size={14} />
                  <span className="text-[10px] uppercase font-bold tracking-widest italic">Auth_Gateway</span>
                </div>
                
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-[#00FF41]/50 uppercase block italic">Bandera Recuperada</label>
                    <input 
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder="CTF{...}"
                      className="w-full bg-black border border-[#00FF41]/40 p-4 rounded text-white mono font-bold text-center placeholder:text-[#00FF41]/20 focus:border-[#00FF41] outline-none shadow-[0_0_20px_rgba(0,255,65,0.05)]"
                      autoFocus
                    />
                  </div>
                  
                  <div className="space-y-4 mt-6">
                    <div className="p-3 bg-[#00FF41]/5 border border-[#00FF41]/10 rounded text-[10px] text-[#00FF41]/60 leading-tight flex gap-2 mono">
                      <AlertTriangle size={12} className="shrink-0 text-[#00FF41]" />
                      <span>Sugerencia: El scheduler de xv6 contiene la subrutina de emergencia.</span>
                    </div>
                    <button 
                      type="submit"
                      className="w-full bg-black hover:bg-[#00FF41] hover:text-black text-[#00FF41] border border-[#00FF41] font-black py-4 rounded transition-all shadow-[0_0_15px_rgba(0,255,65,0.1)] active:scale-95 flex items-center justify-center gap-2"
                    >
                      FORZAR_SYSTEM <Unlock size={18} />
                    </button>
                  </div>
                </form>
              </div>
            </div>

          </div>
        )}

        {status === GameStatus.SUCCESS && (
          <div className="bg-black/95 border border-[#00FF41] p-12 rounded-lg text-center space-y-8 max-w-2xl mx-auto shadow-[0_0_100px_rgba(0,255,65,0.1)] animate-in zoom-in duration-500 backdrop-blur-xl">
            <div className="w-24 h-24 bg-[#00FF41]/10 rounded-full flex items-center justify-center mx-auto border-4 border-[#00FF41] shadow-[0_0_30px_rgba(0,255,65,0.5)]">
              <CheckCircle2 className="text-[#00FF41]" size={56} />
            </div>
            <div className="space-y-4">
              <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter">Acceso xv6 Restaurado</h2>
              <p className="text-[#00FF41]/80 text-sm max-w-sm mx-auto mono">
                El kernel ha sido parcheado con éxito. Eres el nuevo arquitecto del sistema.
              </p>
              <div className="bg-black border-2 border-[#00FF41] p-6 rounded-lg inline-block shadow-[0_0_20px_rgba(0,255,65,0.2)]">
                <span className="text-[10px] text-[#00FF41]/60 uppercase block mb-2 mono">Firma de Sesión:</span>
                <span className="text-[#00FF41] font-black mono text-2xl tracking-widest">{currentFlag}</span>
              </div>
            </div>
            <button 
              onClick={resetToLobby}
              className="bg-[#00FF41] hover:bg-white text-black font-black py-5 px-16 rounded transition-all flex items-center gap-3 mx-auto shadow-xl"
            >
              <RefreshCw size={20} /> REINICIAR NÚCLEO
            </button>
          </div>
        )}

        {status === GameStatus.FAILED && (
          <div className="bg-black/95 border border-red-500 p-12 rounded-lg text-center space-y-8 max-w-2xl mx-auto shadow-2xl backdrop-blur-xl">
            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border-4 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]">
              <AlertTriangle className="text-red-500" size={56} />
            </div>
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-white uppercase italic">Kernel_Panic</h2>
              <p className="text-red-500/70 text-sm mono">El tiempo de respuesta ha expirado. Memoria volátil purgada.</p>
            </div>
            <button 
              onClick={resetToLobby}
              className="bg-red-600 hover:bg-red-500 text-white font-black py-4 px-12 rounded transition-all flex items-center gap-3 mx-auto shadow-lg"
            >
              <RefreshCw size={18} /> HARD_RESET
            </button>
          </div>
        )}

        <div className="flex items-center justify-between text-[#00FF41]/20 text-[10px] mono uppercase tracking-widest px-2 pt-4 border-t border-[#00FF41]/10">
          <span>PLATFORM: XV6-RISCV</span>
          <span>© 2025 MATRIX_KERNEL_RECOVERY_LABS</span>
          <span>SECURITY: OMEGA_III</span>
        </div>
      </div>
      
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #00FF4133; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;
