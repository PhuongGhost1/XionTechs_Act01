# XionTechs Landing Page Rebuild — Phân tích dự án

> Snapshot phân tích ngày 2026-10-01, dựa trên commit `c0cfe45` (branch `main`).
> Mục đích: tổng hợp hiện trạng, requirement, các điểm cần team discuss về design/ý tưởng,
> và danh sách đề xuất cải thiện có ưu tiên.

---

## 1. Tóm tắt (TL;DR)

- **Dự án là gì:** Landing page một trang (single-page) rebuild lại https://xiontechs.com/ cho
  *internal AI build challenge*. Team 3 người, AI phải làm phần việc đáng kể, git history phải
  thể hiện cả 3 người cùng đóng góp.
- **Trạng thái:** Đã có bộ khung hoàn chỉnh 10 section + nav + footer, toàn bộ copy tập trung
  trong `src/content/site.js`. Copy thật đã được trích từ site gốc; phần chưa xác minh được
  đánh dấu `PLACEHOLDER` (14 chỗ trong `src/`).
- **Chưa xong / rủi ro lớn nhất:**
  1. **Chưa có deploy URL** (deliverable bắt buộc) — chưa có config deploy nào trong repo.
  2. **Git history chưa đạt yêu cầu** — toàn bộ code nằm trong *1 commit* duy nhất
     (`c0cfe45 initial project setup`, tác giả `FireFly0000`). Chưa thấy đóng góp của 3 người.
  3. **Docs lệch với code** — `CLAUDE.md` vẫn mô tả theme "green accent", favicon vẫn màu xanh
     lá, trong khi code đã đổi sang navy.
  4. **Còn 4 nhóm nội dung placeholder** (testimonials, case studies, 2 value, 2 FAQ) đang hiển
     thị công khai trên trang, kèm cả hướng dẫn dành cho dev.
  5. **Section Contact không có cách liên hệ thực sự** (không form, email/phone không bấm được)
     — trong khi trang có 5 nút CTA đều trỏ về đó.

---

## 2. Tech stack (tham khảo)

| Hạng mục | Lựa chọn | Ghi chú |
|---|---|---|
| Build tool | Vite 5 | `vite.config.js` mặc định, chỉ có plugin React |
| UI | React 18 (StrictMode) | Không router, không state lib — chỉ `useState` cục bộ |
| Styling | Tailwind CSS 3 + PostCSS + Autoprefixer | Design token trong `tailwind.config.js` |
| Icons | `lucide-react` | Import tường minh qua `src/components/icons.js` (tránh bundle 1MB+) |
| Social icons | SVG tự vẽ | `SocialIcon.jsx` — lucide bản hiện tại không có brand icon |
| Fonts | Google Fonts: Inter (body), Fraunces (heading) | Load qua `<link>` trong `index.html` |
| Lint | ESLint 9 flat config + react-hooks + react-refresh | Không có Prettier |
| Test | Không có | |
| Backend / CMS | Không có | Content là JS object thuần trong `src/content/site.js` |
| Deploy | **Chưa có** | Không có `vercel.json` / `netlify.toml` / GitHub Pages workflow |

> Lưu ý: tại thời điểm phân tích, `node_modules` chưa được cài nên chưa chạy được
> `npm run build` / `npm run lint` để kiểm tra lại. Cần `npm install` trước.

### Cấu trúc thư mục

```
├── CLAUDE.md            # context cho AI agent (luật challenge, gotchas)
├── PROMPT_LOG.md        # log prompt/quyết định — deliverable bắt buộc
├── content/TODO.md      # danh sách nội dung thật còn thiếu
├── index.html           # meta title/description, Google Fonts
├── public/              # logo PNG thật, favicon.svg (còn màu cũ)
├── tailwind.config.js   # design tokens: ink, paper, accent, navy, line...
└── src/
    ├── main.jsx, App.jsx, index.css
    ├── content/site.js  # TOÀN BỘ copy của trang
    └── components/      # 1 section / 1 file + IconBadge, SocialIcon, icons.js
```

---

## 3. Requirement

### 3.1 Requirement từ challenge (bắt buộc)

| # | Requirement | Trạng thái | Ghi chú |
|---|---|---|---|
| R1 | Public deploy URL | ❌ Chưa có | Chưa có config/CI deploy |
| R2 | Git repo với full history, **cả 3 thành viên** cùng đóng góp | ⚠️ Rủi ro | 1 commit chứa toàn bộ code; tác giả: `FireFly0000`, `PhuongGhost1` (chỉ README). Git user hiện tại `Danh Nguyen` chưa có commit |
| R3 | AI làm phần việc đáng kể | ✅ | Thể hiện trong `PROMPT_LOG.md` |
| R4 | `CLAUDE.md` (context sharing) | ⚠️ Có nhưng lỗi thời | Xem mục 5.1 |
| R5 | `PROMPT_LOG.md` gồm prompt, quyết định, **chỗ AI làm sai** | ✅ Tốt, nhưng mới chỉ có entry của 1 người (Bang Do) | Cần entry của 2 người còn lại |
| R6 | Không Lorem Ipsum, không bịa testimonial/số liệu | ✅ Về cơ bản | Đã loại testimonial & case study của theme demo. Xem 4.3 về "copy tự viết" |
| R7 | Nội dung chưa xác minh phải được gắn nhãn placeholder rõ ràng | ✅ | Nhưng cách hiển thị cần bàn — xem 4.3 |
| R8 | "Start clean" — không dùng lại theme/visual identity của site cũ | ⚠️ Cần bàn | Site cũ là corporate **xanh dương-trắng**; bản rebuild đã đổi sang **navy** lấy từ logo. Xem 4.1 |

### 3.2 Requirement chức năng (suy ra từ code hiện tại)

**Trang gồm các section theo thứ tự render (`src/App.jsx`):**

| # | Section | Component | Anchor | Nội dung | Nguồn content |
|---|---|---|---|---|---|
| 0 | Nav sticky | `Nav.jsx` | — | Logo, 7 link, CTA "Talk to us", menu mobile | `nav`, `company` |
| 1 | Hero | `Hero.jsx` | `#top` | Tagline, headline (highlight 1 từ), 2 CTA, promo banner, 3 stats | `company`, `stats` |
| 2 | Services | `Services.jsx` | `#services` | Lưới 8 dịch vụ có icon | `services` |
| 3 | Who We Are | `WhoWeAre.jsx` | `#about` | Giới thiệu, 3 bullet, badge "25 năm" | `whoWeAre` |
| 4 | Process | `Process.jsx` | `#process` | Mô hình 4-D (Discovery → Deployment) | `process` |
| 5 | Why Choose Us | `About.jsx` ⚠️ | `#why-us` | Accordion 3 giá trị (2 placeholder) | `whyChooseUs`, `values` |
| 6 | Case studies | `CaseStudies.jsx` | `#work` | 3 card placeholder | `caseStudies` |
| 7 | CTA | `CTA.jsx` | — | Tiêu đề, nút Contact, số điện thoại, banner | `cta`, `contact` |
| 8 | Testimonials | `Testimonials.jsx` | `#testimonials` | Empty state placeholder | `testimonials = []` |
| 9 | FAQ | `FAQ.jsx` | `#faqs` | Accordion 3 câu (2 placeholder) | `faqs` |
| 10 | Contact | `Contact.jsx` | `#contact` | Phone, email, địa chỉ (chỉ hiển thị text) | `contact` |
| 11 | Footer | `Footer.jsx` | — | Logo, blurb, social, địa chỉ, link công ty/dịch vụ, copyright | nhiều export |

**Hành vi tương tác hiện có:**
- Nav sticky + backdrop blur; menu hamburger trên mobile (đóng khi bấm link).
- Smooth scroll (CSS `scroll-behavior: smooth`).
- 2 accordion (Why Choose Us, FAQ): một mục mở tại một thời điểm, mặc định mở mục đầu.
- Hover animation cho icon badge (scale + rotate + đổi màu), card, nút, social icon.
- Link `tel:` ở section CTA (chỉ số đầu tiên).

### 3.3 Requirement ngầm / chưa được viết ra (đề xuất bổ sung vào spec)

Những thứ một landing page công ty thường cần, hiện **chưa có** và nên team chốt có/không:

- **Kênh chuyển đổi (conversion):** form liên hệ hoặc ít nhất `mailto:` / `tel:` click được.
- **Responsive:** đã dùng breakpoint Tailwind, nhưng chưa có tiêu chí kiểm thử (thiết bị nào,
  width nào).
- **Accessibility:** mức mục tiêu (đề xuất WCAG 2.1 AA).
- **SEO / chia sẻ mạng xã hội:** Open Graph, Twitter card, structured data.
- **Performance budget:** ví dụ JS < 200KB, Lighthouse ≥ 90.
- **Ngôn ngữ:** chỉ tiếng Anh, hay cần tiếng Việt? (2/3 văn phòng ở Việt Nam).
- **Legal:** footer có "Privacy Policy", "Terms of Service" nhưng không có trang nào.

---

## 4. Design & ý tưởng — các điểm cần team discuss

### 4.1 Màu chủ đạo navy có vi phạm "start clean" không?

- Luật challenge: *không dùng lại theme/visual identity của site cũ*. Site cũ là "generic
  corporate blue-and-white".
- Hướng ban đầu: off-white + ink + **green accent** (đã chốt trong `PROMPT_LOG.md`).
- Sau đó đổi sang **navy `#183860`** lấy trực tiếp từ logo.
- **Lập luận ủng hộ navy:** đó là *màu thương hiệu* (logo), không phải *theme* WordPress; theme
  mới khác ở layout, typography (Fraunces serif), khoảng trắng, góc bo.
- **Lập luận phản đối:** người chấm nhìn lướt sẽ thấy "vẫn là xanh dương-trắng" → dễ bị đánh
  giá là không "start clean".
- **Cần quyết định:** giữ navy (và ghi rõ lập luận vào `PROMPT_LOG.md` + `CLAUDE.md`), hay dùng
  navy chỉ cho logo/điểm nhấn nhỏ và chọn một accent thứ hai khác biệt hơn.

### 4.2 Bố cục & nhịp section

- **Thứ tự nav ≠ thứ tự trang:** nav là Services → About → *Why Choose Us* → *Process* → …,
  nhưng trang render Process **trước** Why Choose Us. Nên thống nhất.
- **Contact và Footer đều nền navy, liền nhau** → nhìn như một khối, section Contact mất điểm
  nhấn. Cân nhắc đổi nền Contact hoặc gộp hẳn Contact vào footer.
- **Số "25 năm" xuất hiện 2 lần** (stat ở Hero + badge ở Who We Are). Badge WhoWeAre chỉ là
  một khối màu với một con số — khá trống; có thể thay bằng ảnh team/văn phòng (nếu có thật).
- **Quá nhiều CTA cùng đích:** "Talk to us", "Get In Touch", "Get started now", "Contact Us"
  đều nhảy tới `#contact`, nơi không có hành động nào để làm. Nên chọn 1 CTA chính + 1 phụ.
- **Hero thiếu visual:** chỉ có chữ. Cần bàn có thêm hình minh hoạ/ảnh thật/visual trừu tượng
  không. (Không dùng ảnh stock giả làm "team của chúng tôi".)
- **Section Testimonials & Case Studies đang rỗng** chiếm 2 section giữa trang — kéo chất
  lượng cảm nhận xuống (xem 4.3).
- **Nav 7 mục + logo + nút ở breakpoint `md` (768px)** nhiều khả năng bị chật/tràn. Nên hiện
  nav desktop từ `lg`, hoặc rút gọn còn 4–5 mục.

### 4.3 Chiến lược hiển thị placeholder

Hiện tại placeholder được hiển thị trực tiếp cho người xem, ví dụ:
- Testimonials: *"Add real testimonials to `src/content/site.js` once the team has them."* —
  đây là lời nhắn cho **dev**, không phải cho **khách truy cập**.
- Case studies: tiêu đề vẫn là tên project của **theme demo** ("Cloud Security Service"...),
  chỉ đổi tag thành `PLACEHOLDER`. Tiêu đề này cũng không phải dự án thật.
- Accordion/FAQ: "PLACEHOLDER — confirm the real supporting copy…".

**Các phương án cần chọn:**

| Phương án | Ưu | Nhược |
|---|---|---|
| A. Giữ như hiện tại | Minh bạch tối đa với giám khảo | Trang trông chưa xong; lộ hướng dẫn dev |
| B. Một component `<Placeholder>` thống nhất, câu chữ hướng tới người xem ("Case studies coming soon") + nhãn nhỏ "Placeholder" | Vẫn tuân thủ luật, trông chuyên nghiệp hơn | Thêm chút code |
| C. Ẩn hẳn section/mục chưa có nội dung thật (cờ `enabled` trong `site.js`) | Trang gọn, không gì là giả | Mất section, trang ngắn hơn |
| D. Viết copy mới cho 2 value + 2 FAQ, team sign-off | Không còn placeholder ở đó | Phải ghi rõ trong log là copy do team viết, không phải từ site gốc |

Đề xuất: **C cho testimonials & case studies** (không có dữ liệu thật thì đừng có section),
**D cho values & FAQ** (đó là copy mô tả, không phải số liệu/claim — luật cho phép nếu team
duyệt và ghi log). Nếu muốn chứng minh tuân thủ với giám khảo, ghi rõ trong `PROMPT_LOG.md`.

### 4.4 Chất lượng copy gốc

Copy lấy nguyên từ site cũ có vài chỗ kém, cần quyết định *giữ nguyên vì là "real"* hay
*sửa nhẹ*:
- CTA: **"We Make Awesome IT Services For Your Newly Business"** — sai ngữ pháp ("Newly").
- FAQ #1: "XionTechs offers … **They** provide …" — lẫn ngôi.
- Hero: "Perfect IT Solutions For Your Business" — rất chung chung, không khác biệt.
- Footer service links ("Custom Software", "AI/ML Solutions") không khớp tên trong danh sách
  services ("Custom App Development", "AI-Powered Solutions").

Đồng thời có **copy do AI/team tự viết** nằm hardcode trong component (không ở `site.js`):
"What we do", "Eight capabilities, one accountable team…", "How we work", "Our 4-D model keeps
every engagement accountable.", "Selected work", "What clients say", "Let's build something
real"… Những câu này không phải số liệu nên không vi phạm luật, nhưng nên:
(1) chuyển vào `site.js` cho đúng convention, (2) đánh dấu là "copy mới" trong comment để
phân biệt với copy lấy từ site gốc.

### 4.5 Nội dung cần xác minh lại (có mâu thuẫn)

- **Stat "3 Strategic Office Locations: Dallas, Ho Chi Minh City, Da Nang"**, nhưng `contact.addresses`
  chỉ có **2 địa chỉ, cả hai đều ở TP.HCM**, không có Dallas hay Đà Nẵng. Hoặc stat sai, hoặc
  thiếu địa chỉ.
- `company.name = 'XionTechs'` vs `legalName = 'XionTech Joint Stock Company'` (thiếu "s") —
  cần xác nhận tên pháp lý chính xác.
- "25+ years of leadership experience" & "20+ tech stack" — có trên site gốc, nhưng đây là
  claim; nên giữ nguồn trích dẫn trong comment.

### 4.6 Các ý tưởng mở rộng (tuỳ thời gian)

- Trang song ngữ EN/VI (content tách theo locale trong `site.js`).
- Dark mode (token đã tách sẵn, làm khá rẻ).
- Animation khi scroll (reveal) — nhẹ, có tôn trọng `prefers-reduced-motion`.
- Section "Tech stack / platforms" dạng logo grid (Azure, AWS, GCP, Power Platform, n8n… đều
  đã được nhắc trong copy dịch vụ → là thông tin thật).
- Section "Careers" nếu công ty đang tuyển (staffing là một dịch vụ).

---

## 5. Vấn đề & đề xuất cải thiện (có ưu tiên)

Ký hiệu ưu tiên: **P0** = phải làm trước hand-in · **P1** = nên làm · **P2** = nice-to-have.

### 5.1 Quy trình / deliverable

| Ưu tiên | Vấn đề | Đề xuất |
|---|---|---|
| P0 | Chưa có deploy | Chọn Vercel/Netlify/GitHub Pages (build `vite build`, output `dist/`). Thêm URL vào README |
| P0 | Git history: 1 commit khổng lồ, 1 tác giả | Từ giờ chia việc theo người, commit nhỏ, mỗi người tự commit bằng tài khoản của mình; mỗi người thêm entry vào `PROMPT_LOG.md` |
| P0 | `CLAUDE.md` lỗi thời: còn ghi "green accent"; mục "Known placeholders" còn liệt kê email & social link (đã giải quyết) | Cập nhật lại; trỏ sang `content/TODO.md` làm nguồn duy nhất thay vì chép danh sách |
| P1 | `public/favicon.svg` vẫn màu xanh lá `#2f6f4f`, hình chữ "X" chung chung | Làm favicon từ logo hoặc dùng navy |
| P1 | README quá ngắn | Thêm: deploy URL, ảnh chụp màn hình, phân công 3 người, cách sửa content |
| P2 | Không có CI | GitHub Action chạy `npm run lint && npm run build` trên mỗi PR |
| P2 | Không kiểm soát placeholder | Script nhỏ đếm/list `PLACEHOLDER` trong `src/` (in ra khi build) để biết còn bao nhiêu trước demo |

### 5.2 Chức năng / UX

| Ưu tiên | Vấn đề | Vị trí | Đề xuất |
|---|---|---|---|
| P0 | Anchor bị header sticky che mất tiêu đề section khi nhảy tới | `src/index.css` | `html { scroll-padding-top: 5rem; }` hoặc `scroll-mt-20` trên các section |
| P0 | Contact không có hành động: email không phải `mailto:`, phone không phải `tel:` | [Contact.jsx](../src/components/Contact.jsx), [Footer.jsx](../src/components/Footer.jsx) | Bọc bằng `<a href="mailto:…">` / `<a href="tel:…">` |
| P1 | Không có form liên hệ | `Contact.jsx` | Form tĩnh qua Formspree / Netlify Forms / Web3Forms (không cần backend). Cần chốt có cần không |
| P1 | Footer: "Privacy Policy", "Terms of Service", "Support Center", tất cả link dịch vụ đều là text chết | [Footer.jsx](../src/components/Footer.jsx) | Link dịch vụ → `#services`; "About Us"/"Contact us" → anchor; bỏ các mục không có trang, hoặc link về trang tương ứng trên site gốc |
| P1 | Thứ tự nav không khớp thứ tự trang | `site.js` `nav` vs `App.jsx` | Đồng bộ |
| P1 | Tên component gây nhầm: `About.jsx` render "Why Choose Us" (`#why-us`), còn "About" thật là `WhoWeAre.jsx` (`#about`) | `src/components/` | Đổi tên `About.jsx` → `WhyChooseUs.jsx` |
| P1 | Nav desktop từ `md` có thể bị chật | [Nav.jsx](../src/components/Nav.jsx) | Đổi `md:` → `lg:` cho nav desktop & nút hamburger |
| P2 | Không highlight mục nav đang xem | `Nav.jsx` | IntersectionObserver đánh dấu active section |
| P2 | Menu mobile không đóng bằng phím Esc, không có transition | `Nav.jsx` | Thêm handler Esc + transition nhẹ |
| P2 | "Eight capabilities" hardcode số 8 | [Services.jsx](../src/components/Services.jsx) | Dùng `services.length` hoặc chuyển câu vào `site.js` |

### 5.3 Accessibility

| Ưu tiên | Vấn đề | Đề xuất |
|---|---|---|
| P1 | Độ tương phản thấp: `text-ink/50` trên nền `paper` ≈ **3.4:1**; `text-paper/40` trên `navy` ≈ **3.6:1** — dưới chuẩn AA (4.5:1) cho chữ nhỏ | Nâng lên tối thiểu `/60` (ink) và `/60` (paper trên navy) |
| P1 | Không tôn trọng `prefers-reduced-motion` (rotate/scale/translate ở mọi hover, smooth scroll) | Dùng `motion-safe:` của Tailwind; tắt smooth scroll trong media query reduce |
| P1 | Accordion thiếu `aria-controls` / `id` cho panel | `About.jsx`, `FAQ.jsx`: gắn id cho panel, `aria-controls` cho button. Có thể gộp thành 1 component `Accordion` dùng chung |
| P1 | Nút hamburger thiếu `aria-expanded`, `aria-controls` | `Nav.jsx` |
| P2 | Không có "Skip to content" link | Thêm link ẩn ở đầu trang tới `<main id="main">` |
| P2 | Chưa có style `focus-visible` rõ ràng cho nút bo tròn | Thêm `focus-visible:ring-2 ring-accent ring-offset-2` |
| P2 | Social link mở tab mới không báo trước | Thêm text ẩn "(opens in new tab)" |

### 5.4 Code quality

| Ưu tiên | Vấn đề | Đề xuất |
|---|---|---|
| P1 | `About.jsx` và `FAQ.jsx` trùng logic accordion gần như 100% | Tách `Accordion.jsx` dùng chung, nhận `items` + biến thể màu |
| P1 | Pattern heading section (eyebrow + h2 + sub) lặp lại ở ~8 component với class khác nhau chút ít | Tách `SectionHeader` → typography đồng nhất |
| P1 | Copy hardcode trong component (vi phạm convention trong `CLAUDE.md`) | Chuyển toàn bộ heading/subheading vào `site.js` |
| P2 | `IconBadge` crash nếu `iconMap[name]` không tồn tại (gõ sai tên icon trong `site.js` → trắng trang) | Fallback icon + `console.warn` khi dev |
| P2 | Key dùng text nội dung (`key={f.q}`, `key={t.name}`) — trùng text là lỗi | Chấp nhận được với dữ liệu tĩnh; hoặc thêm `id` vào data |
| P2 | Không có Prettier / format thống nhất cho 3 người | Thêm Prettier + `prettier-plugin-tailwindcss` (tự sắp class) để giảm diff nhiễu giữa các thành viên |
| P2 | Hero dùng `<dl>` với `dt` = con số, 2 `dd` — ngữ nghĩa hơi gượng | Chấp nhận được; hoặc dùng `<ul>` thường |

### 5.5 SEO / Performance

| Ưu tiên | Vấn đề | Đề xuất |
|---|---|---|
| P1 | Thiếu Open Graph / Twitter meta → share link lên LinkedIn/Facebook không có ảnh/preview | Thêm `og:title`, `og:description`, `og:image` (ảnh 1200×630), `og:url` |
| P1 | Toàn bộ nội dung render bằng JS phía client | Với 1 trang tĩnh, có thể prerender lúc build (vd. `vite-react-ssg` hoặc plugin prerender) → HTML có sẵn nội dung, tốt cho SEO & first paint |
| P2 | Không có structured data | JSON-LD `Organization` (tên, logo, địa chỉ, phone, sameAs = social) |
| P2 | Không có `robots.txt`, `sitemap.xml`, canonical | Thêm khi có domain deploy |
| P2 | Google Fonts load từ bên ngoài (chặn render, vấn đề privacy/GDPR) | Self-host qua `@fontsource/inter`, `@fontsource-variable/fraunces` |
| P2 | `<img>` logo không có `width/height` → layout shift nhẹ | Thêm kích thước tường minh |

---

## 6. Content còn thiếu (đồng bộ với `content/TODO.md`)

| Mục | Hiện trạng | Cần gì | Người phụ trách (điền) |
|---|---|---|---|
| Testimonials | Mảng rỗng, hiển thị empty state | 2–4 quote thật (tên, vai trò, công ty) hoặc bỏ section | |
| Case studies | 3 card với tiêu đề từ theme demo | Project thật (có thể ẩn danh nếu NDA): scope, stack, kết quả — hoặc bỏ section | |
| Why Choose Us — "Integrity & Ethical Standards", "High Quality Delivery" | PLACEHOLDER | Copy thật hoặc copy mới được team duyệt | |
| FAQ #2, #3 | PLACEHOLDER | Câu trả lời thật hoặc copy mới được team duyệt | |
| Địa chỉ văn phòng | 2 địa chỉ TP.HCM, stat nói Dallas + HCM + Đà Nẵng | Xác minh, bổ sung/sửa | |
| Tên pháp lý | "XionTech Joint Stock Company" | Xác minh chính tả | |
| Ảnh team/văn phòng | Không có | Tuỳ chọn | |
| OG image | Không có | Ảnh 1200×630 | |

---

## 7. Đề xuất phân chia công việc cho 3 người (gợi ý)

Mục tiêu kép: xong việc **và** git history thể hiện rõ 3 người đóng góp.

| Người | Mảng | Việc cụ thể |
|---|---|---|
| A | Infra & chất lượng | Deploy + CI, cập nhật `CLAUDE.md`/README, favicon, SEO meta/OG/JSON-LD, fix scroll-padding |
| B | Content & copy | Chốt chiến lược placeholder (4.3), xác minh địa chỉ/tên pháp lý, chuyển copy hardcode vào `site.js`, sửa/viết copy được duyệt |
| C | UI/UX & a11y | Tách `Accordion` + `SectionHeader`, contact links/form, footer links, contrast, reduced-motion, nav `lg` breakpoint, các thay đổi design sau khi chốt mục 4 |

Mỗi người: commit nhỏ, tự commit bằng tài khoản mình, ghi ít nhất 1–2 entry vào `PROMPT_LOG.md`
(kể cả chỗ AI làm sai).

---

## 8. Checklist trước khi nộp

- [ ] `npm install && npm run lint && npm run build` chạy sạch
- [ ] Deploy URL public hoạt động, có trong README
- [ ] Git log có commit của cả 3 thành viên
- [ ] `CLAUDE.md` khớp với code hiện tại (màu, placeholder)
- [ ] `PROMPT_LOG.md` có entry của cả 3 người, có ghi lỗi của AI
- [ ] Không còn nội dung trông như thật mà chưa xác minh; mọi placeholder còn lại được gắn nhãn rõ
- [ ] Không còn hướng dẫn dành cho dev hiển thị trên trang public
- [ ] Kiểm tra mobile (375px), tablet (768px), desktop (1280px)
- [ ] Lighthouse: Accessibility & SEO ≥ 90
- [ ] Favicon, title, OG preview hiển thị đúng
