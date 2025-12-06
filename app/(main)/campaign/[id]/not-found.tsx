import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-lg text-gray-600 mb-8">
          요청하신 체험단을 찾을 수 없습니다.
        </p>
        <Link
          href="/search"
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          검색 페이지로 돌아가기
        </Link>
      </div>
    </div>
  );
}

