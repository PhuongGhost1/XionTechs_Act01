# XionTechs Landing Page — Phân tích v2 (branch `feat/approve-and-drills`)

> Phân tích ngày 2026-10-01, HEAD `dd9b91e`. Thay thế cho bản phân tích trước, vốn viết dựa trên `main @ c0cfe45`.
> **Phạm vi:** đã đọc docs, specs, `site.js`, theme, mọi section component và phần đầu `AgentDemo` / `WorkflowGraph`.
> Phần ruột của demo (`WorkflowList`, `DecisionButtons`, `DrillMenu`, `RunMonitor`, `AgentJourney`,
> `src/workflow/*.js`) **chưa review chi tiết** (bị dừng do hết usage limit). Mục 5.4 nên bổ sung sau.

---

## 1. Tóm tắt

- **Định vị đã đổi hoàn toàn:** từ "công ty IT outsource" sang **"AI agents + smart platform (IoT)"**, nhắm tới decision-maker (CEO/COO/founder).
- **Điểm nhấn mới:** một **agent demo tương tác**, gồm:
  - workflow graph SVG có 3 kịch bản;
  - view "Agent at work";
  - người xem tự bấm Approve/Reject ("You're the approver");
  - "Throw a problem at it" (các bài tập lỗi: retry / escalate);
  - run monitor.
- **Theme:** hệ thống 3 theme lấy màu từ logo (Classic Navy, Midnight, Aurum), dùng CSS variables, có picker trong nav.
- **Chất lượng kỹ thuật tốt:**
  - 110 test pass, lint sạch, build OK.
  - Logic chạy demo là hàm thuần (pure) và có test.
  - Có content guard: cấm lorem, cấm chữ số trong nội dung demo.
- **Rủi ro lớn nhất:**
  1. **Chưa có deploy URL** (vẫn chưa có config deploy nào).
  2. **Git history lệch:** 45/48 commit là của **Phuong Hoang**. Danh Nguyen chỉ có 1 commit, và commit đó nằm trên `main`, **không có** trong branch này. 4 branch xếp chồng lên nhau, chưa branch nào được merge.
  3. **Nhiều copy PLACEHOLDER hiển thị như nội dung thật**, không có nhãn trên trang: hero headline/subline, CTA band, intro các section.
  4. **Phạm vi lệch về phía demo:** khoảng một nửa effort nằm ở demo minh hoạ, trong khi nội dung thật về công ty vẫn còn thiếu.

## 2. Trạng thái build/test (đã chạy thật)

| Lệnh | Kết quả |
|---|---|
| `npm test` | ✅ 6 file, **110 test pass** (themes 5, layout 6, journey 14, run 18, site 23, workflowStyles 44) |
| `npm run lint` | ✅ sạch |
| `npm run build` | ✅ main JS **63.50 kB gzip**, `AgentDemo` lazy chunk **10.73 kB gzip**, CSS 5.40 kB gzip. Budget là 71 kB, vẫn dưới mức |

Ghi chú:
- Có file `yarn.lock` untracked nằm song song với `package-lock.json`. Nên chọn một package manager và xoá lock file còn lại.
- Thực tế đã cài `vitest` 2.1.9.

## 3. Tech stack & kiến trúc

- Vite 5 + React 18 + Tailwind 3. Không backend.
- Dependency runtime chỉ có `lucide-react`. Vitest là devDependency.
- **Theme:**
  - Token màu dạng `rgb(var(--x) / <alpha>)` trong `tailwind.config.js`; giá trị từng theme nằm ở `src/index.css`.
  - Một script inline trong `index.html` chống nháy theme khi load.
  - `ThemeProvider` + `ThemePicker` lưu lựa chọn vào `localStorage` (key `xt-theme`).
- **Content:** toàn bộ nằm trong `src/content/site.js` (534 dòng): `company`, `pillars`, `workflows`, `agentJourneys`, `runLog`, `stack`, `roadmap`, `sections`, …
- **Demo:** pure logic ở `src/workflow/{run,layout,journey}.js`, component chỉ render.
  - `AgentDemo` được lazy-load và bọc trong `SectionErrorBoundary`.
  - Fallback của Suspense vẫn giữ anchor `#demo`.
- **Thứ tự section (`App.jsx`):** Nav → Hero → Pillars (`#solutions`) → AzureStrip (`#stack`) → AgentDemo (`#demo`) → WhyUs (`#why-us`) → Roadmap (`#roadmap`) → CaseStudies (`#work`, dạng strip) → FAQ → Contact (CTA + contact gộp) → Footer.
  - Nav và thứ tự trang **đã khớp nhau** (lỗi này có ở bản cũ, giờ đã sửa).
- **Docs quy trình:**
  - `docs/superpowers/specs` (4 spec) và `plans` (4 plan, khoảng 5.800 dòng).
  - `PROMPT_LOG.md` chi tiết, ghi rõ các chỗ AI/plan làm sai — điểm mạnh cho challenge.

## 4. Requirement

### 4.1 Requirement của challenge

| # | Requirement | Trạng thái | Ghi chú |
|---|---|---|---|
| R1 | Public deploy URL | ❌ | Không có Vercel/Netlify/GH Pages config, README không có URL |
| R2 | Git history thể hiện **cả 3 người** | ⚠️ **Rủi ro cao** | `Phuong Hoang` 45 commit; `FireFly0000` 1 (scaffold); `PhuongGhost1` 1 (README); `Danh Nguyen` 1 (trên `main`, chưa có trong branch này). `PROMPT_LOG` còn nhắc "Bang Do", nhưng tên này không xuất hiện trong git author nào. Cần map tên ↔ account |
| R3 | AI làm phần việc đáng kể | ✅ | Spec → plan → review → fix wave, có log |
| R4 | `CLAUDE.md` | ✅ | Đã cập nhật theo theme và quy ước của demo |
| R5 | `PROMPT_LOG.md` có cả chỗ AI sai | ✅ Rất tốt | Nhưng chỉ có entry của 2 người (Bang Do, Phuong Hoang) |
| R6 | Không bịa số liệu/testimonial | ✅ | Có test chặn chữ số trong demo; testimonials không render; case studies chỉ còn 1 dòng "đang chuẩn bị" |
| R7 | Nội dung chưa xác minh phải được gắn nhãn rõ | ⚠️ **Chưa đều** | Xem mục 6.1 |
| R8 | "Start clean" | ✅ Hợp lý hơn bản cũ | Navy + gold lấy từ logo, có 3 theme, layout mới hẳn |

### 4.2 Requirement chức năng hiện có

- **Theme:**
  - 3 theme; mặc định theo `prefers-color-scheme`; nhớ lựa chọn của người xem.
  - Picker đóng được bằng Esc và click ra ngoài.
- **Hero:** CTA "See an agent work" → `#demo`, "Book a call" → `#contact`; trust line 3 văn phòng; hình chữ X ghép từ các node, dạng SVG.
- **Pillars:** 3 card, nút "Learn more" mở rộng chi tiết ngay trong card; card có copy nháp hiện tag "Draft copy".
- **Agent demo:**
  - Tab ARIA đúng chuẩn (phím mũi tên, Home, End); toggle view Workflow / Agent at work.
  - Pause/Play/Replay; Replay chuyển sang branch tiếp theo.
  - Click vào node để xem chi tiết bước.
  - Lần chạy đầu tiên dừng ở bước approval, chờ người xem bấm Approve/Reject (không có timer).
  - Mỗi kịch bản có 2 drill; nhật ký hành động của người xem được hiển thị trong RunMonitor.
  - Chỉ chạy khi section đang trong viewport.
  - Khi bật reduced motion: hiển thị luôn trạng thái cuối.
  - Mobile: chuyển sang dạng list; desktop có list `sr-only` làm text alternative cho screen reader.
- **Roadmap:** 4 giai đoạn Explore → Pilot → Production → Scale, từng giai đoạn sáng lên khi cuộn tới.
- **Contact:** nút copy email; số điện thoại là link `tel:`; nút "Book a call" thực chất là `mailto:`; có link social.

### 4.3 Requirement còn thiếu / nên bổ sung vào spec

- Kênh chuyển đổi thật: form liên hệ hoặc link đặt lịch (Calendly/Teams Bookings).
- SEO/OG meta, OG image, JSON-LD `Organization`.
- Tiêu chí "hand-in ready": số placeholder tối đa được phép, Lighthouse ≥ 90.
- Kế hoạch merge 4 branch xếp chồng vào `main`, và quyết định cái gì được deploy.

## 5. Vấn đề & đề xuất (P0 = trước hand-in · P1 = nên làm · P2 = nice-to-have)

### 5.1 Quy trình

| Ưu tiên | Vấn đề | Đề xuất |
|---|---|---|
| P0 | Chưa deploy | Dùng Vercel/Netlify: build `npm run build`, output `dist`. Deploy từ branch đã merge |
| P0 | 4 branch chồng nhau chưa merge; `main` có commit `d40be55` (Danh) không nằm trong branch này | Merge chuỗi `landing-redesign → agent-workflow-graph → agent-at-work → approve-and-drills` vào `main` (hoặc rebase lên `main`), xử lý conflict ở `docs/` |
| P0 | Đóng góp lệch về 1 người | Phần việc còn lại (mục 7) chia cho 2 người kia, mỗi người tự commit và tự viết entry trong `PROMPT_LOG` |
| P1 | `yarn.lock` untracked song song `package-lock.json` | Chọn npm (đang dùng trong docs), xoá `yarn.lock` |
| P1 | README chưa nhắc `npm test`, chưa có URL deploy và ảnh chụp | Cập nhật |
| P2 | Không có CI | GitHub Action chạy `lint` + `test` + `build` |

### 5.2 Nội dung / tuân thủ luật

| Ưu tiên | Vấn đề | Vị trí | Đề xuất |
|---|---|---|---|
| P0 | **Hero headline + subline là PLACEHOLDER nhưng không có nhãn nào trên trang** | `company.heroHeadline/heroSubline`, `Hero.jsx` | Team chốt copy, hoặc thêm tag "Draft copy" như ở Pillars |
| P0 | **CTA band** ("Ready to explore your first agent?") là PLACEHOLDER, không có nhãn | `ctaBand`, `Contact.jsx` | Như trên |
| P0 | Intro các section (`sections.*`) là PLACEHOLDER, chỉ ghi chú trong comment | `site.js` | Chốt copy hoặc gắn nhãn |
| P1 | Pillar bullet hiển thị chữ "PLACEHOLDER — Workflow agents" ngay trong list, lại thêm tag "Draft copy" → bị lặp nhãn và trông xấu | `pillars[0..1]` | Bỏ tiền tố "PLACEHOLDER —" trong value, dùng một cơ chế nhãn duy nhất (cờ `placeholder` → tag) |
| P1 | Roadmap có mô tả nhịp/thời lượng: "A few hours", "Weekly check-ins", "A quarterly roadmap review". Điều này mâu thuẫn với spec ("No durations") | `roadmap` | Team xác nhận cách làm thật hoặc bỏ đi |
| P1 | Stat "3 văn phòng: Dallas, HCM, Đà Nẵng" (hero cũng hiển thị như dữ liệu thật) nhưng `contact.addresses` có 2 địa chỉ, **cả hai đều ở TP.HCM** | `company.offices`, `stats`, `contact` | Xác minh địa chỉ Dallas/Đà Nẵng hoặc sửa lại |
| P1 | Values (2 mục) và FAQ (2 câu) vẫn hiển thị "PLACEHOLDER — confirm…" | `values`, `faqs` | Team viết copy và sign-off, ghi log |
| P1 | "Built on Microsoft Azure" và "Smart Agent Platform (IoT)" là định vị mới, **không có trên site gốc**, chỉ dựa trên lời một thành viên | `stack`, `pillars[1]` | Cần sign-off từ phía công ty; nếu không có thì giữ nhãn draft hoặc hạ giọng claim |
| P2 | `legalName` "XionTech Joint Stock Company" (thiếu "s") | `company` | Xác minh |
| P2 | Copy FAQ #1 lẫn ngôi ("XionTechs offers… They provide…") | `faqs[0]` | Sửa nhẹ nếu team đồng ý |

### 5.3 UX / chức năng

| Ưu tiên | Vấn đề | Vị trí | Đề xuất |
|---|---|---|---|
| P0 | Header sticky che tiêu đề section khi nhảy tới anchor (không có `scroll-padding-top`) | `index.css` | `html { scroll-padding-top: 5rem }` |
| P1 | Nút "Book a call" ở Contact thực chất là `mailto:` → kỳ vọng sai | `Contact.jsx` | Đổi nhãn thành "Email us", hoặc gắn link đặt lịch thật |
| P1 | Footer: email/phone không click được; "Privacy Policy", "Terms", "Support Center" và các link dịch vụ là text chết | `Footer.jsx` | Gắn `mailto:`/`tel:`/anchor; bỏ các mục không có trang |
| P1 | Nav desktop bật từ `md` (768px) với 6 link + theme picker + CTA → dễ bị chật | `Nav.jsx` | Đổi sang `lg:` |
| P1 | Favicon vẫn là chữ X màu **xanh lá** của theme đầu tiên | `public/favicon.svg` | Làm lại theo navy/gold |
| P2 | Menu mobile không đóng bằng Esc | `Nav.jsx` | Thêm handler |
| P2 | Hover animation (rotate/scale/translate) của `IconBadge` và social icon không có `motion-safe:` | `IconBadge.jsx`, `Footer.jsx` | Thêm `motion-safe:` |
| P2 | Bấm "See an agent work" khi chunk demo chưa tải xong → trang có thể giật vị trí cuộn | `App.jsx` | Đặt chiều cao cố định cho fallback, hoặc preload chunk khi hover vào CTA |
| P2 | Chưa có OG/Twitter meta, JSON-LD, robots/sitemap; font Google tải từ CDN ngoài | `index.html` | Bổ sung; cân nhắc self-host font |

### 5.4 Code quality

| Ưu tiên | Vấn đề | Đề xuất |
|---|---|---|
| P1 | `AgentDemo.jsx` có 342 dòng, ~12 `useState`, status line là ternary lồng 6 tầng | Gom state vào `useReducer`; tách hàm `statusText(state, drill, run)` thuần và viết test cho nó |
| P1 | Danh sách theme id bị lặp ở `index.html` (inline script) và `themes.js` | Thêm test đọc `index.html` để đảm bảo hai bên khớp, hoặc inject lúc build |
| P2 | `Testimonials.jsx` là dead code, còn dùng token cũ (`bg-white/60`, `text-ink/50`) và câu hướng dẫn cho dev | Xoá, hoặc cập nhật token nếu muốn giữ |
| P2 | Accordion bị lặp ở `WhyUs` và `FAQ`; thiếu `aria-controls` | Tách thành component `Accordion` dùng chung |
| P2 | `IconBadge` crash nếu tên icon trong `site.js` sai | Thêm fallback, hoặc test kiểm tra mọi `icon` có trong `iconMap` |
| — | *Chưa review:* `WorkflowList`, `DecisionButtons`, `DrillMenu`, `RunMonitor`, `AgentJourney`, `src/workflow/*` | Review ở lượt sau |

## 6. Design & ý tưởng — cần team discuss

1. **Trọng tâm trang:** demo giờ là phần lớn nhất (nhiều code, nhiều spec, nhiều tương tác), nhưng là nội dung **minh hoạ**. Phần chứng minh năng lực thật (case study, testimonial, team) vẫn trống.
   - Câu hỏi: người chấm và khách hàng sẽ thấy một demo ấn tượng, hay một trang "nhiều hứa hẹn, ít bằng chứng"?
   - Đề xuất: **dừng thêm feature cho demo**, dồn effort còn lại vào nội dung thật và deploy.
2. **Định vị AI/IoT/Azure-first:** có khớp với cách công ty thật sự bán dịch vụ không? Nếu không ai trong công ty sign-off thì rebuild này đang "đổi định vị" thay vì "rebuild".
3. **Độ phức tạp của demo đối với decision-maker:** tab × 2 view × branch × approve/reject × drill × run monitor là rất nhiều thứ cần hiểu.
   - Nên cân nhắc mặc định đơn giản hơn: chỉ một kịch bản, ẩn drill sau "Advanced".
   - Có thể làm một test nhanh với người ngoài team.
4. **3 theme:** giá trị thực cho landing page công ty là bao nhiêu, so với chi phí kiểm thử ×3? Có thể giữ 2 (light/dark theo hệ thống) và ẩn picker.
5. **Placeholder strategy thống nhất:** chọn một cơ chế duy nhất (cờ `placeholder`/`draft` → tag "Draft copy") và áp dụng cho mọi section, kể cả hero và CTA.
6. **Case studies:** dòng "Client case studies are being prepared" là trung thực. Nhưng nếu có thể xin được 1 dự án thật (ẩn danh) thì đây là chỗ cải thiện nhiều nhất về độ tin cậy.

## 7. Gợi ý chia việc còn lại (để cân bằng git history)

| Người | Việc |
|---|---|
| Danh Nguyen | Merge các branch vào `main`, deploy + CI, `scroll-padding`, favicon, footer/contact links, nav `lg`, SEO/OG |
| Người thứ 3 | Content: chốt hero/CTA/sections/roadmap/values/FAQ, xác minh văn phòng và tên pháp lý, thống nhất cơ chế nhãn draft, xoá `Testimonials.jsx` |
| Phuong Hoang | Refactor `AgentDemo` (reducer + `statusText`), review các component demo chưa xem, giảm độ phức tạp mặc định của demo |

Mỗi người tự viết entry của mình trong `PROMPT_LOG.md`.

## 8. Checklist hand-in

- [ ] Branch đã merge vào `main`; `npm test && npm run lint && npm run build` xanh
- [ ] Deploy URL public, có trong README
- [ ] Git log có commit thực chất của cả 3 người
- [ ] Mọi copy chưa sign-off đều có nhãn **hiển thị trên trang**, không chỉ trong comment
- [ ] Không còn link chết trong footer
- [ ] Kiểm tra 3 theme × 390/1280 px; Lighthouse a11y/SEO ≥ 90
- [ ] Favicon/OG đúng brand
