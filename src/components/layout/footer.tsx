export function Footer() {
  return (
    <footer className="border-t border-border bg-navy-500 text-white">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-2">
              <span className="text-white">Darwin</span>{" "}
              <span className="text-gold-400">2040</span>
            </h3>
            <p className="text-sm text-navy-200">
              창업가와 중소기업 경영자를 위한
              <br />
              비즈니스 커뮤니티
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-2 text-gold-400">
              바로가기
            </h4>
            <ul className="space-y-1 text-sm text-navy-200">
              <li>세미나 일정</li>
              <li>회원 가입</li>
              <li>문의하기</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-2 text-gold-400">
              연락처
            </h4>
            <ul className="space-y-1 text-sm text-navy-200">
              <li>이메일: info@darwin2040.kr</li>
              <li>전화: 02-XXX-XXXX</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-4 border-t border-navy-400 text-center text-xs text-navy-300">
          &copy; 2024 Darwin 2040. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
