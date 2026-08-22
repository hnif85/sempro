export function Section({
  id,
  eyebrow,
  title,
  description,
  children,
  dark = false,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <section
      id={id}
      className={`px-5 py-16 lg:px-8 ${dark ? "bg-[#061c3b] text-white" : "bg-white text-[#0b2348]"}`}
    >
      <div className="mx-auto max-w-[1240px]">
        {(eyebrow || title) && (
          <div className="mb-8 text-center">
            {eyebrow && (
              <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${dark ? "text-[#53d8ff]" : "text-[#0878f9]"}`}>
                {eyebrow}
              </p>
            )}
            <h2 className="mt-2 text-3xl font-black tracking-[-0.045em] sm:text-4xl">{title}</h2>
            {description && (
              <p className={`mx-auto mt-3 max-w-[560px] text-sm leading-6 ${dark ? "text-blue-100/70" : "text-[#6c809e]"}`}>
                {description}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
