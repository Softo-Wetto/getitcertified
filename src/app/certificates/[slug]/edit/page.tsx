import EditCertificateConsole from "@/components/EditCertificateConsole";

export default async function EditCertificatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <EditCertificateConsole slug={slug} />;
}
