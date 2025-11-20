# Global Kariyer AI 🌍🚀

Global Kariyer AI, Türk teknoloji profesyonellerinin (Yazılımcı, Product Manager, Tasarımcı vb.) yurtdışı iş başvurularında rekabet avantajı elde etmelerini sağlayan yapay zeka destekli bir kariyer asistanıdır.

## Özellikler

*   **CV Analizi:** Yüklenen PDF/DOCX formatındaki CV'leri analiz eder.
*   **ATS Uyumluluk Kontrolü:** Aday Takip Sistemleri (ATS) için skorlama yapar.
*   **AI Destekli İyileştirme:** Google Gemini AI kullanarak CV'yi İngilizce olarak yeniden yazar ve optimize eder.
*   **Anlık Önizleme:** Optimize edilmiş CV'yi anında görüntüler.
*   **Word İndirme:** Hazır CV'yi .docx formatında indirmenizi sağlar.

## Teknoloji Yığını

### Frontend (`client/`)
*   React (Vite)
*   Tailwind CSS v4
*   Framer Motion (Animasyonlar)
*   React Markdown & Rehype Raw

### Backend (`server/`)
*   Node.js & Express
*   Google Gemini API (AI Modeli)
*   Multer (Dosya İşleme)
*   PDF-Parse & Mammoth (Doküman Okuma)

## Kurulum

Projeyi yerel ortamınızda çalıştırmak için:

1.  Repoyu klonlayın.
2.  Backend kurulumu:
    ```bash
    cd server
    npm install
    # .env dosyası oluşturun ve GEMINI_API_KEY ekleyin
    npm start
    ```
3.  Frontend kurulumu:
    ```bash
    cd client
    npm install
    npm run dev
    ```

## Lisans

Bu proje MIT lisansı ile lisanslanmıştır.
