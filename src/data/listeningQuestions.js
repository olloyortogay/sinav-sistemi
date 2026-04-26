export const listeningIntroText = [
  'Bu bölümde 6 dinleme metni bulunmaktadır. Her bir metni dinlemeden önce soruları okumanız için süre verilecektir.',
  'Cevaplarınızı cevap kağıdının ilgili bölümlerine işaretlemeyi unutmayınız.',
];

export const listeningDistribution = [
  '1. Dinleme Metni 1-8',
  '2. Dinleme Metni 9-14',
  '3. Dinleme Metni 15-18',
  '4. Dinleme Metni 19-23',
  '5. Dinleme Metni 24-29',
  '6. Dinleme Metni 30-35',
];

export const listeningSections = [
  {
    id: 'section1',
    title: '1. DİNLEME METNİ',
    instruction:
      'Sorular 1-8. Dinlediğiniz cümleleri tamamlayınız. Cümleleri iki defa dinleyeceksiniz. Her cümleye cevap olabilecek en doğru seçeneği (A, B veya C) işaretleyiniz.',
    sample: {
      text: 'S0.',
      options: ['A) Sinirli olmamaya çalışıyorum.', 'B) Fedakar olmayı artık bıraktım.', 'C) İşlerim yolunda.'],
      answer: 'Doğru cevap: B',
    },
    questions: [
      { id: 'l1', type: 'multiple_choice', questionNo: 1, question: 'S1.', options: ['A) Trafikte takılıp kaldım, her şey arapsaçına döndü.', 'B) İşler yolundaydı, sorunsuz geldim.', 'C) Yolda hiçbir sorun yaşamadım.'] },
      { id: 'l2', type: 'multiple_choice', questionNo: 2, question: 'S2.', options: ['A) Hemen çözüm bulduk.', 'B) İşler sarpa sardı, elim kolum bağlı kaldı.', 'C) Başkalarına danıştım.'] },
      { id: 'l3', type: 'multiple_choice', questionNo: 3, question: 'S3.', options: ['A) Öyledir, o çok konuşkan ve geveze.', 'B) Sanmıyorum, cömert insana benziyor.', 'C) Evet, uzun zamandır ağzını bıçak açmıyor.'] },
      { id: 'l4', type: 'multiple_choice', questionNo: 4, question: 'S4.', options: ['A) Çünkü zaman kısıtlaması vardı.', 'B) Sunumu tamamlayamadım.', 'C) Sunum çok başarılı geçti.'] },
      { id: 'l5', type: 'multiple_choice', questionNo: 5, question: 'S5.', options: ['A) Bu görevi tamamlamak benim için çok zordu.', 'B) Görev bana verilmeden önce birkaç kişi denemişti.', 'C) Daha önce benzer bir görevde başarılı olmuştum.'] },
      { id: 'l6', type: 'multiple_choice', questionNo: 6, question: 'S6.', options: ['A) Yeterince vakit bulamadım.', 'B) Proje zaten erken bitti.', 'C) Ekip arkadaşım projeye katkıda bulundu.'] },
      { id: 'l7', type: 'multiple_choice', questionNo: 7, question: 'S7.', options: ['A) Kitap çok ilginçti.', 'B) Okumak için yeterince zamanım olmadı.', 'C) Ondan sonra başka bir kitabı okumaya başladım.'] },
      { id: 'l8', type: 'multiple_choice', questionNo: 8, question: 'S8.', options: ['A) Çünkü bana yeni bir fırsat sundu.', 'B) Henüz bir karar vermedim.', 'C) O proje çok fazla zaman alır.'] },
    ],
  },
  {
    id: 'section2',
    title: '2. DİNLEME METNİ',
    instruction:
      'Sorular 9-14. Dinlediğiniz metne göre aşağıdaki cümleler için DOĞRU ya da YANLIŞ seçeneklerinden birini işaretleyiniz.',
    subInstruction:
      'DOĞRU – cümle, dinleme metnindeki bilgilerle uyumlu ve/veya tutarlıysa\nYANLIŞ – cümle, dinleme metnindeki bilgilerle tutarsız ve/veya çelişkiliyse',
    questions: [
      { id: 'l9', type: 'true_false', questionNo: 9, question: 'S9. Vücut tipine uygun bir spor seçmek, kişinin yaşam boyu spor yapma alışkanlığı kazanmasını kolaylaştırabilir.' },
      { id: 'l10', type: 'true_false', questionNo: 10, question: 'S10. Bazı insanlar hiç spor yapmadan atletik ve sağlıklı bir görünüme sahip olabilirler.' },
      { id: 'l11', type: 'true_false', questionNo: 11, question: 'S11. Yuvarlak vücut hatlara sahip kişiler, kolayca kilo verebilir ve spor yapmaya hemen adapte olabilirler.' },
      { id: 'l12', type: 'true_false', questionNo: 12, question: 'S12. İnce yapılı kişilerin enerjileri genellikle uzun süre dayanır ve kilo verirken sadece yağ kaybederler.' },
      { id: 'l13', type: 'true_false', questionNo: 13, question: 'S13. Başka bir tip insanlar metabolizmaları yavaş olduğu halde, spor yapmadan formda kalabilirler.' },
      { id: 'l14', type: 'true_false', questionNo: 14, question: 'S14. Dinleme metninde geçen “çocuk oyuncağı” ifadesi “Çocukların oynayıp eğlenmesi için yapılmış oyuncak” anlamında kullanılmamıştır.' },
    ],
  },
  {
    id: 'section3',
    title: '3. DİNLEME METNİ',
    instruction:
      'Sorular 15-18. Şimdi insanların farklı durumlardaki konuşmalarını dinleyeceksiniz. Her konuşmacının (15-18) konuşmalarını ait olduğu seçenekleri (A-F) işaretleyiniz. Seçmemeniz gereken İKİ seçenek bulunmaktadır.',
    questions: [
      { id: 'l15', type: 'multiple_choice', questionNo: 15, question: 'S15. 1. konuşmacı ...', options: ['A', 'B', 'C', 'D', 'E', 'F'] },
      { id: 'l16', type: 'multiple_choice', questionNo: 16, question: 'S16. 2. konuşmacı ...', options: ['A', 'B', 'C', 'D', 'E', 'F'] },
      { id: 'l17', type: 'multiple_choice', questionNo: 17, question: 'S17. 3. konuşmacı ...', options: ['A', 'B', 'C', 'D', 'E', 'F'] },
      { id: 'l18', type: 'multiple_choice', questionNo: 18, question: 'S18. 4. konuşmacı ...', options: ['A', 'B', 'C', 'D', 'E', 'F'] },
    ],
  },
  {
    id: 'section4',
    title: '4. DİNLEME METNİ',
    instruction:
      'Dinleme metnine göre haritadaki yerleri (A-H) işaretleyiniz (19-23). Seçilmemesi gereken ÜÇ seçenek bulunmaktadır.',
    questions: [
      { id: 'l19', type: 'multiple_choice', questionNo: 19, question: 'S19. Spor salonu ...', options: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] },
      { id: 'l20', type: 'multiple_choice', questionNo: 20, question: 'S20. Gıda mağazası ...', options: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] },
      { id: 'l21', type: 'multiple_choice', questionNo: 21, question: 'S21. Eskişehir Oteli ...', options: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] },
      { id: 'l22', type: 'multiple_choice', questionNo: 22, question: 'S22. Lokanta ...', options: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] },
      { id: 'l23', type: 'multiple_choice', questionNo: 23, question: 'S23. Hayvanat bahçesi ...', options: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] },
    ],
  },
  {
    id: 'section5',
    title: '5. DİNLEME METNİ',
    instruction:
      'Sorular 24-29. Aşağıdaki soruları okuyunuz ve dinleme metinlerine göre doğru seçeneği (A, B ya da C) işaretleyiniz.',
    questions: [
      { id: 'l24', type: 'multiple_choice', questionNo: 24, groupTitle: '1. diyalog', question: 'S24. Karşılıklı konuşmada, salgınla ilgili hangi çıkarım yapılabilir?', options: ['A) Her iki kişi de seyahat kısıtlamaları nedeniyle gelecekle ilgili belirsizlik yaşıyor.', 'B) Sadece biri salgından etkileniyor, diğeri seyahatine devam edebilecek.', 'C) İkisi de salgının yakın zamanda sona ereceğine inanıyor.'] },
      { id: 'l25', type: 'multiple_choice', questionNo: 25, question: 'S25. Konuşmadaki gelecek planları hakkında ne söylenebilir?', options: ['A) İkisi de kariyer hedeflerini net olarak belirlemiş ve gelecekteki başarılarını garanti altına almış durumda.', 'B) Kişilerden birinin uzun vadeli ciddi bir kariyer planı belirtilmemişken, diğeri ekonomik çıkarlarla ilgili enterasan bir plan yapıyor.', 'C) Kişilerden biri zengin olmak konusunda azimliyken, diğeri zengin eş bulup evlenerek daha ilginç bir plan yapıyor.'] },
      { id: 'l26', type: 'multiple_choice', questionNo: 26, groupTitle: '2. diyalog', question: 'S26. Dinçer’in Günay’a karşı tavrı, konuşmanın başından itibaren nasıl şekilleniyor?', options: ['A) yardım etmeye istekli ve açık', 'B) mesafeli ve cimri', 'C) samimi fakat maddi yardıma yanaşmayan'] },
      { id: 'l27', type: 'multiple_choice', questionNo: 27, question: 'S27. Dinçer’in tavrı, hangi toplumsal değeri ya da normu yansıtıyor?', options: ['A) yardımseverlik ve fedakârlık', 'B) bireysel sorumluluk ve bağımsızlık', 'C) karşılıklı çıkar ilişkisine dayalı dostluk'] },
      { id: 'l28', type: 'multiple_choice', questionNo: 28, groupTitle: '3. diyalog', question: 'S28. Mete, tatilinde yaşadığı sorunları nasıl çözümlemeye çalışmış olabilir?', options: ['A) Tatili iptal ederek her şeyi yoluna koymaya çalışmış olabilir.', 'B) Sabırlı olup, bir sonraki tatilinde daha iyi planlar yapmaya karar vermiş olabilir.', 'C) Başka bir otele geçerek tatilini devam ettirmiş olabilir.'] },
      { id: 'l29', type: 'multiple_choice', questionNo: 29, question: 'S29. Aşağıdakilerden hangisi hem Mete hem de Ezgi için söylenebilir?', options: ['A) Kötü tatil deneyimi yaşamak', 'B) İyi ders çıkarmak', 'C) Planları daha düzgün yapmak'] },
    ],
  },
  {
    id: 'section6',
    title: '6. DİNLEME METNİ',
    instruction:
      'Sorular 30-35. Dinleme metnine göre doğru seçeneği (A, B ya da C) işaretleyiniz.',
    questions: [
      { id: 'l30', type: 'multiple_choice', questionNo: 30, question: 'S30. Dil gelişimi ...', options: ['A) doğuştan gelen bir yetiye sahiptir.', 'B) insanların bebeklik döneminde kazanan kurallar bütünüdür.', 'C) çocukluğun ilk sekiz yılında neredeyse tamamlanır.'] },
      { id: 'l31', type: 'multiple_choice', questionNo: 31, question: 'S31. Dinlediğiniz metinden aşağıdaki yargılardan hangisi çıkarılamaz?', options: ['A) Çevresel koşullar da dil gelişimi üzerinde etkilidir.', 'B) Olayları jest ve mimik olarak çocuğa açıklamak da dil gelişiminde etkilidir.', 'C) Dil zamanla kazanılan bir kurallar bütünüdür.'] },
      { id: 'l32', type: 'multiple_choice', questionNo: 32, question: 'S32. Aşağıdakilerden hangisi çocuğun dil gelişimini destekler?', options: ['A) Çocuğa anlık durum ve olaylarla ilgili açıklama yapmak', 'B) Çocuğa kendi sözcüklerini uydurması için destek olmak', 'C) Çocukla konuşurken uzun ve kompleks cümleler kullanmak'] },
      { id: 'l33', type: 'multiple_choice', questionNo: 33, question: 'S33. Çocukla kurulan iletişimde onun uydurduğu sözcükler ...', options: ['A) tercih edilmelidir.', 'B) dil gelişiminin en önemli şartıdır.', 'C) tekrar edilmemelidir.'] },
      { id: 'l34', type: 'multiple_choice', questionNo: 34, question: 'S34. Çocuğun isteğini işaretle anlatma davranışı ...', options: ['A) ebeveynler tarafından farkında değilmişçesine davranılmalıdır.', 'B) ebeveynler tarafından ödüllendirilmelidir.', 'C) anormal bir durumdur.'] },
      { id: 'l35', type: 'multiple_choice', questionNo: 35, question: 'S35. Dinlediğiniz metinde aşağıdakilerden hangisine değinilmemiştir?', options: ['A) Çocuğun sözcük dağarcığını geliştirmeye yönelik oyunlara', 'B) Dilin toplumların oluşmasındaki katkılarına', 'C) Çocuğun konuşmayı bir iletişim yolu olarak kullanması için yapılması gerekenlere'] },
    ],
  },
];

export const listeningReferenceChoices = {
  A: 'Terapi merkezinin tanıtım reklamı verilmiştir.',
  B: 'Manav ürünlerinin fiyatlarında indirim fırsatı.',
  C: 'Kara yolu seferleri düzenlendiğine dair bilgiler var.',
  D: 'İvedilik söz konusudur.',
  E: 'Kara yolu ulaşım aracıyla ilgili uyarı niteliğindedir.',
  F: 'Mesai zamanı belirtilmiştir.',
};

export const listeningFinishNote =
  'DİNLEME BÖLÜMÜ BİTMİŞTİR. CEVAPLARINIZI CEVAP KAĞIDINA İŞARETLEMENİZ İÇİN 10 DAKİKA ZAMANINIZ VAR.';

export const listeningAnswerKey = {
  1: 'A',
  2: 'B',
  3: 'C',
  4: 'A',
  5: 'C',
  6: 'A',
  7: 'B',
  8: 'A',
  9: 'A',
  10: 'A',
  11: 'B',
  12: 'B',
  13: 'B',
  14: 'A',
  15: 'E',
  16: 'D',
  17: 'F',
  18: 'C',
  19: 'B',
  20: 'A',
  21: 'C',
  22: 'E',
  23: 'G',
  24: 'A',
  25: 'B',
  26: 'C',
  27: 'B',
  28: 'B',
  29: 'A',
  30: 'C',
  31: 'B',
  32: 'A',
  33: 'C',
  34: 'A',
  35: 'B',
};

