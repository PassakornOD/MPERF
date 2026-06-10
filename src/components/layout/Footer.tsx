'use client';

const Footer = () => {
  return (
    <footer className="w-full py-8 mt-auto border-t border-border bg-background/50">
      <div className="max-w-[1400px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-[10px]  text-muted-foreground uppercase ">
          &copy; {new Date().getFullYear()} &nbsp; Mperf Analytics &bull; Professional Infrastructure Intelligence
        </p>
        <div className="flex items-center gap-6">
          <span className="text-[9px]  text-muted-foreground/60 uppercase ">v2.0.0 Production</span>
          <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
          <span className="text-[9px]  text-emerald-600 uppercase ">Systems Online</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
