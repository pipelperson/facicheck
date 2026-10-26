import logo from "@/assets/logo-facicheck.jpeg.asset.json";

export function Brand() {
  return (
    <a href="#beranda" className="flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
      <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-card">
        <img src={logo.url} alt="Logo FaciCheck" width={40} height={40} className="h-10 w-10 object-contain" />
      </span>
      <span className="truncate text-lg font-bold tracking-tight text-navy">FaciCheck</span>
    </a>
  );
}
