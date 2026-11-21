import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid h-full place-items-center p-8">
      <div className="text-center">
        <div className="text-sm text-muted">۴۰۴</div>
        <h1 className="mt-2 text-xl font-semibold">این مسیر در پروژه نیست</h1>
        <Link href="/" className="mt-4 inline-block text-sm text-accent underline">
          بازگشت به نمای کلی
        </Link>
      </div>
    </div>
  );
}
