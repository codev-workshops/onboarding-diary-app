interface PlaceholderPageProps {
  title: string;
}

export default function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{title}</h1>
      <div className="bg-white shadow-md rounded-xl p-6">
        <p className="text-gray-600">This page is under construction and will be available in a future phase.</p>
      </div>
    </div>
  );
}
