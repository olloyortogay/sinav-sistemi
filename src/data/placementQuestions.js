export const placementQuestions = [
  // ==========================================
  // A1 SEVİYESİ (Soru 1 - 28)
  // ==========================================

  // --- A1 Okuma Metinleri ---
  {
    id: "group_a1_reading_1",
    level: "A1",
    type: "reading_group",
    instruction: "1. ve 2. soruya aşağıdaki metne göre cevap veriniz.",
    context: "Merhaba benim adım Vedat. Ben matematik öğretmeniyim. Benim okulum İstanbul Fatih'te. Pazartesi üç saat dersim var. Salı, çarşamba ve perşembe günleri iki saat dersim var. Cuma günü bir saat dersim var.",
    questions: [
      { id: 1, question: "1. Vedat öğretmenin hangi gün en az dersi var?", options: ["pazartesi", "salı", "çarşamba", "cuma"], correctAnswer: "cuma" },
      { id: 2, question: "2. Vedat öğretmenin hangi gün en fazla dersi var?", options: ["pazartesi", "salı", "çarşamba", "cuma"], correctAnswer: "pazartesi" }
    ]
  },
  {
    id: "group_a1_reading_2",
    level: "A1",
    type: "reading_group",
    instruction: "3. ve 4. soruya aşağıdaki metne göre cevap veriniz.",
    context: "Ben Cemil. On iki yaşındayım. Hafta içi her sabah erkenden kalkıyorum. Kahvaltı ediyorum, elbiselerimi giyiyorum ve okula gidiyorum. Bütün gün okuldayım. Ben okulu çok seviyorum. Öğlen saat 12.30 ve 14.00 arasında ders yok. Ben ve arkadaşlarım bu saatler arasında yemeğimizi yiyoruz ve okulun bahçesinde oyun oynuyoruz. Saat 16.30'da dersler bitiyor ve eve dönüyorum.",
    questions: [
      { id: 3, question: "3. Metinde aşağıdaki sorulardan hangisinin cevabı yoktur?", options: ["Cemil kaç yaşında?", "Cemil saat kaçta kalkıyor?", "Cemil öğlen arasında ne yapıyor?", "Cemil'in okulunda dersler saat kaçta bitiyor?"], correctAnswer: "Cemil saat kaçta kalkıyor?" },
      { id: 4, question: "4. Cemil her sabah erken kalkıyor.", options: ["Doğru", "Yanlış"], correctAnswer: "Doğru", type: "true_false" }
    ]
  },
  {
    id: "group_a1_reading_3",
    level: "A1",
    type: "reading_group",
    instruction: "5. ve 6. soruya aşağıdaki metne göre cevap veriniz.",
    context: "Ali küçük bir köyde, gölün kenarında küçük bir evde yaşıyor. Ali'nin bir erkek kardeşi ve bir ablası var. Ali'nin babası çiftçi, annesi ev hanımı. Ali, erkek kardeşinden iki yaş büyük. Onlar lisede öğrenci. Ali'nin kardeşi, Ali'den daha çalışkan. Ali'nin ablası Ankara'da yaşıyor. O evli. Onun iki yaşında bir oğlu var. Onun kocası bir şirkette müdür. Onlar bayramlarda ve tatillerde Ali'nin köyüne geliyorlar.",
    questions: [
      { id: 5, question: "5. Aşağıdakilerden hangisi Ali hakkında doğru bir bilgidir?", options: ["Ali bayramlarda ve tatillerde ablasının yanına gidiyor.", "Ali'nin ablası bir şirkette müdür.", "Ali, ailenin ikinci çocuğudur.", "Ali, kardeşinden daha başarılı bir öğrencidir."], correctAnswer: "Ali, ailenin ikinci çocuğudur." },
      { id: 6, question: "6. Metinde aşağıdakilerden hangisi hakkında bir bilgi vardır?", options: ["Ali'nin yaşı", "Ali'nin ablasının adı", "Ali'nin köyünün ismi", "Ali'nin babasının mesleği"], correctAnswer: "Ali'nin babasının mesleği" }
    ]
  },
  {
    id: "group_a1_reading_4",
    level: "A1",
    type: "reading_group",
    instruction: "7. ve 8. soruya aşağıdaki metne göre cevap veriniz.",
    context: "Benim şehrimin adı Sinop. Sinop Türkiye'nin en kuzeyinde, denizin kenarında bir şehir. Burada iki yüz binden fazla insan yaşıyor. İnsanların çoğu çiftçilik yapıyor. Hava genellikle nemli ve yağışlıdır. Buraya her zaman çok yağmur yağar ama hava çok soğuk olmaz. Şehrimde Sinop Kalesi, Sinop Yarımadası, Erfelek Şelaleleri gibi birçok güzel turistik yer vardır.",
    questions: [
      { id: 7, question: "7. Metinde aşağıdaki sorulardan hangisinin cevabı vardır?", options: ["Sinop'ta kaç tane turistik yer vardır?", "Sinop'a nasıl gidiyoruz?", "Sinop'un hava durumu nasıldır?", "Sinop'un büyüklüğü ne kadardır?"], correctAnswer: "Sinop'un hava durumu nasıldır?" },
      { id: 8, question: "8. Sinop bir sahil şehridir.", options: ["Doğru", "Yanlış"], correctAnswer: "Doğru", type: "true_false" }
    ]
  },

  // --- A1 Görsel Bölüm ---
  {
    id: "group_a1_visual_1",
    level: "A1",
    type: "visual_group",
    instruction: "9. ve 10. soruya aşağıdaki görsele göre cevap veriniz.",
    mediaUrl: "/assets/a1_okuma5_9-10sorular.png",
    mediaType: "image",
    questions: [
      { id: 9, question: "9. Fotoğrafta terlikler nerede?", options: ["Halının yanında", "Halının üstünde", "Halının altında", "Halının arkasında"], correctAnswer: "Halının üstünde" },
      { id: 10, question: "10. Fotoğrafta perdenin önünde ne var?", options: ["gitar", "televizyon", "minder", "koltuk"], correctAnswer: "gitar" }
    ]
  },

  // --- A1 Kelime & Dil Bilgisi ---
  { id: 11, level: "A1", type: "multiple_choice", question: "11. Bu masa ____ ?", options: ["kimin", "ne zaman", "nerede", "kaçta"], correctAnswer: "kimin" },
  { id: 12, level: "A1", type: "multiple_choice", question: "12. Ders saat ____ başlıyor?", options: ["ne zaman", "nerede", "kaçta", "ne"], correctAnswer: "kaçta" },
  { id: 13, level: "A1", type: "multiple_choice", question: "13. ____ lokantada çalışıyor.", options: ["Kasap", "Garson", "Marangoz", "Manav"], correctAnswer: "Garson" },
  { id: 14, level: "A1", type: "multiple_choice", question: "14. İşçiler ofis ____ geliyor.", options: ["-ten", "-e", "-de", "-in"], correctAnswer: "-e" },
  { id: 15, level: "A1", type: "multiple_choice", question: "15. Benim ____ bilgisayar, tahta, sıralar ve masalar var.", options: ["sınıfımızda", "sınıfımda", "sınıfınızda", "sınıfında"], correctAnswer: "sınıfımda" },
  { id: 16, level: "A1", type: "multiple_choice", question: "16. Ayşe ............. Çünkü çok hasta.", options: ["evde yatıyor", "ders çalışıyor", "televizyon izliyor", "müzik dinliyor"], correctAnswer: "evde yatıyor" },
  { id: 17, level: "A1", type: "multiple_choice", question: "17. Gece ____ kitap okuyorum.", options: ["uyumadan önce", "uyuduktan sonra", "uyurken", "uyumadan"], correctAnswer: "uyumadan önce" },
  { id: 18, level: "A1", type: "multiple_choice", question: "18. Abid: Nerelisin? Hassan: Ürdün____", options: ["lüyüm", "lüm", "liyim", "li"], correctAnswer: "lüyüm" },
  { id: 19, level: "A1", type: "multiple_choice", question: "19. Annem____ çanta çok güzel.", options: ["in", "nin", "im", "den"], correctAnswer: "in" },
  { id: 20, level: "A1", type: "multiple_choice", question: "20. Arkadaşlarım ____ bekliyor.", options: ["bana", "beni", "ben", "benim"], correctAnswer: "beni" },
  { id: 21, level: "A1", type: "multiple_choice", question: "21. ____ yarın pikniğe gidiyoruz.", options: ["Ben", "Sen", "Biz", "Siz"], correctAnswer: "Biz" },
  { id: 22, level: "A1", type: "multiple_choice", question: "22. Kardeşim köpek____ çok korkuyor.", options: ["ten", "den", "tan", "dan"], correctAnswer: "ten" },

  // --- A1 Dinleme ---
  {
    id: 23, level: "A1", type: "matching",
    instruction: "23. Dinlediğiniz metne göre aşağıdaki sorular ve cevapları eşleştiriniz.",
    mediaUrl: "/assets/a1-dinleme1.mp3", mediaType: "audio",
    pairs: [
      { q: "Mehmet kaç yaşında?", a: "35" },
      { q: "Serdar ve Mehmet kaç yıldır arkadaşlar?", a: "17" },
      { q: "Mehmet haftada kaç gün çalışıyor?", a: "3" },
      { q: "Mehmet'in kaç tane çocuğu var?", a: "1" }
    ]
  },
  {
    id: "group_a1_listening_2", level: "A1", type: "audio_group",
    instruction: "Dinlediğiniz metne göre 24 - 28. sorulara cevap veriniz.",
    mediaUrl: "/assets/a1-dinleme2.mp3", mediaType: "audio",
    questions: [
      { id: 24, question: "24. Fatih, İstanbul'un en büyük ilçesidir.", options: ["Doğru", "Yanlış"], correctAnswer: "Yanlış", type: "true_false" },
      { id: 25, question: "25. Fevzi Paşa Caddesi, Fatih'in en büyük caddesidir.", options: ["Doğru", "Yanlış"], correctAnswer: "Doğru", type: "true_false" },
      { id: 26, question: "26. Emin'in evi, Fevzi Paşa Caddesi'nde.", options: ["Doğru", "Yanlış"], correctAnswer: "Yanlış", type: "true_false" },
      { id: 27, question: "27. Emin, hafta içi Fevzi Paşa Caddesi'ne gidiyor.", options: ["Doğru", "Yanlış"], correctAnswer: "Yanlış", type: "true_false" },
      { id: 28, question: "28. Emin, Fevzi Paşa Caddesi'nde alışveriş yapıyor.", options: ["Doğru", "Yanlış"], correctAnswer: "Doğru", type: "true_false" }
    ]
  },

  // ==========================================
  // A2 SEVİYESİ (Soru 29 - 46)
  // ==========================================

  // --- A2 Okuma ---
  {
    id: "group_a2_reading_1", level: "A2", type: "reading_group",
    instruction: "29. ve 30. soruya aşağıdaki metne göre cevap veriniz.",
    context: "Herkes başarılı insanların sırrını merak eder. Onların sırrı aslında basit birkaç alışkanlık ve karakter özelliğidir. Bunlar kişiden kişiye değişir fakat bunlardan önemli bir tanesi hepsinde ortaktır. Bu da disiplin. Başarılı insanlar kendi kurallarını koyup bu kurallarına göre hayatlarına devam ederler. Boş zamanlarında tembellik yapmayıp yeni bir şeyler ararlar. Sosyal hayatlarındaki zamanlarını planlamadan hareket etmezler.",
    questions: [
      { id: 29, question: "29. Metne göre aşağıdaki cümlelerden hangisi doğrudur?", options: ["Başarılı insanların alışkanlıkları ortaktır.", "Başarılı insanlar kendilerine boş zaman bulur.", "Başarılı insanlar başkalarının kurallarına göre yaşar.", "Başarılı insanlar sosyal hayatlarındaki zamanı önceden planlar."], correctAnswer: "Başarılı insanlar sosyal hayatlarındaki zamanı önceden planlar." },
      { id: 30, question: "30. Metinde aşağıdaki sorulardan hangisinin cevabı vardır?", options: ["Başarılı insanların kuralları nelerdir?", "Başarılı insanlar boş zamanlarında ne yapar?", "Başarılı insanlar sosyal hayatlarına ne kadar zaman ayırır?", "Başarılı insanların kurallarını kendi hayatımızda kullanabilir miyiz?"], correctAnswer: "Başarılı insanlar boş zamanlarında ne yapar?" }
    ]
  },
  {
    id: "group_a2_reading_2", level: "A2", type: "reading_group",
    instruction: "31. ve 32. soruya aşağıdaki metne göre cevap veriniz.",
    context: "Son zamanlarda iklimler değişiyor. Bu iklim değişiklikleri rakamlar ile çok küçük gibi görünüyor fakat hayatımızda büyük etkiler yaratıyor. Hem kuraklık hem de aşırı yağmurlar dünyanın dengesini bozuyor... Bunun en önemli nedeni karbon gazları. Bu gazlar atmosferdeki sıcaklığı artırıyor. Bu yüzden kutuplardaki buzlar eriyip denizlerin su seviyesini yükseltiyor. Denizlerin yanındaki İtalya, Hollanda gibi ülkeler bu değişiklikten ciddi şekilde zarar görüyor.",
    questions: [
      { id: 31, question: "31. Sıcaklıklar artıyor bu sebeple her yerde susuzluk problemi başladı.", options: ["Doğru", "Yanlış"], correctAnswer: "Yanlış", type: "true_false" },
      { id: 32, question: "32. Deniz seviyesindeki değişiklik bazı ülkeleri olumsuz etkiliyor.", options: ["Doğru", "Yanlış"], correctAnswer: "Doğru", type: "true_false" }
    ]
  },
  {
    id: "group_a2_reading_3", level: "A2", type: "reading_group",
    instruction: "33. soruya aşağıdaki metne göre cevap veriniz.",
    context: "Diyetlerde insanlar genellikle aç kalırlar. Ama bu doğru değildir. Aç vücut, daha fazla yağ ve enerji saklamak ister. Bu sebeple yağlarınız erimez. Bu yüzden diyette sık sık ama az az bir şeyler yiyin. Kahvaltı ve öğle yemeği arasında bir avuç kuru yemiş yiyin. Öğle yemeği ile akşam yemeği arasında ise bir meyve yiyebilirsiniz. Akşam geç saatlerde yemek yiyemezsiniz. Çünkü gece vücudunuz bu enerjiyi harcayamaz.",
    questions: [
      { id: 33, question: "33. Metne göre aşağıdaki cümlelerden hangisi yanlıştır?", options: ["Diyetlerde aç kalıp zayıflayabiliriz.", "Diyette günde 3 öğünden fazla yiyebilirsiniz.", "Akşam yemeğinden sonra yemek doğru değildir.", "Yemeklerin arasında meyve ve kuru yemiş yiyebilirsiniz."], correctAnswer: "Diyetlerde aç kalıp zayıflayabiliriz." }
    ]
  },

  // --- A2 Kelime & Dil Bilgisi ---
  { id: 34, level: "A2", type: "multiple_choice", question: "34. Odama kitaplarım için yeni bir kitap ____ aldım.", options: ["lık", "lik", "luk", "lük"], correctAnswer: "lık" },
  { id: 35, level: "A2", type: "multiple_choice", question: "35. Önümüzdeki hafta sonu mangal ____ (Hangisi uygun değildir?)", options: ["yapacağız", "yapıyoruz", "yapmalıyız", "yaptık"], correctAnswer: "yaptık" },
  { id: 36, level: "A2", type: "multiple_choice", question: "36. Arkadaşlarımla görüşemiyorum ____ telefonum bozuldu.", options: ["ama", "çünkü", "veya", "bu yüzden"], correctAnswer: "çünkü" },
  { id: 37, level: "A2", type: "multiple_choice", question: "37. Osman aslan ____ bir gençtir. Hiçbir şeyden korkmaz.", options: ["gibi", "kadar", "için", "göre"], correctAnswer: "gibi" },
  { id: 38, level: "A2", type: "multiple_choice", question: "38. Kütüphane gece açık değil. Orada sabaha kadar ders ____", options: ["çalışamazsın", "çalışabilirsin", "çalışmalısın", "çalışacaksın"], correctAnswer: "çalışamazsın" },
  { id: 39, level: "A2", type: "multiple_choice", question: "39. Rutin hayattan sıkıldım. Hadi hep birlikte uzun bir tatile ____", options: ["çıktık", "çıkalım", "çıkıyoruz", "çık"], correctAnswer: "çıkalım" },
  { id: 40, level: "A2", type: "multiple_choice", question: "40. Annem çocukluğumu anlattı. Ben bir yaşında ____", options: ["yürüdüm", "yürümüşüm", "yürüyorum", "yürüyeceğim"], correctAnswer: "yürümüşüm" },
  { id: 41, level: "A2", type: "multiple_choice", question: "41. Dışarı çık____ arkadaşlarımla buluşacağım.", options: ["-ıp", "-arak", "-madan", "-ınca"], correctAnswer: "-ıp" },
  { id: 42, level: "A2", type: "multiple_choice", question: "42. Selim bugünlerde çok tembel. ____ ödevlerini yapıyor ____ kitap okuyor.", options: ["Hem/hem", "Ne/ne", "Ya/ya", "Gerek/gerek"], correctAnswer: "Ne/ne" },
  { id: 43, level: "A2", type: "multiple_choice", question: "43. Köyümüzde her yerde ormanlar var. Yolda ____ ağaçların arasında yürüyoruz.", options: ["yürürken", "yürüyüp", "yürümek", "yürüdükçe"], correctAnswer: "yürürken" },

  // --- A2 Dinleme ---
  {
    id: "group_a2_listening_1", level: "A2", type: "audio_group",
    instruction: "Dinlediğiniz metne göre 44 ve 45. sorulara cevap veriniz.",
    mediaUrl: "/assets/a2-dinleme1.mp3", mediaType: "audio",
    questions: [
      { id: 44, question: "44. Krep için ne kadar un koyuyoruz?", options: ["iki adet", "iki tane", "İki bardak", "iki avuç"], correctAnswer: "İki bardak" },
      { id: 45, question: "45. Krepi pişirmeden önce yağı ____", options: ["ısıtıyoruz", "döküyoruz", "karıştırıyoruz", "soğutuyoruz"], correctAnswer: "ısıtıyoruz" }
    ]
  },
  {
    id: 46, level: "A2", type: "matching",
    instruction: "46. Dinlediğiniz metne göre aşağıdaki cümleler ve isimleri eşleştiriniz.",
    mediaUrl: "/assets/a2-dinleme2.mp3", mediaType: "audio",
    pairs: [
      { q: "Yaz aylarında hayvanlarla ilgilendi.", a: "Jeff Bezos" },
      { q: "Okulu bitiremedi. Çünkü okuldan attılar.", a: "Socihora Honda" },
      { q: "Ticarete sadece altı yaşında başladı.", a: "Ingvar Kamprad" }
    ]
  },

  // B1 VE B2 BURAYA GELECEK...
// ==========================================
  // B1 SEVİYESİ (Soru 47 - 63)
  // ==========================================

  // --- B1 Okuma ---
  {
    id: "group_b1_reading_1", level: "B1", type: "reading_group",
    instruction: "47. ve 48. soruya aşağıdaki metne göre cevap veriniz.",
    context: "Birçok insana göre israf sadece su, para, yemek gibi maddeleri aşırı kullanmaktır. TDK sözlüğüne göre ise israf, gereksiz yere para, zaman ve emek harcamaktır. Yani zamanımızı, emeğimizi doğru şeye harcamazsak ömrümüzü israf etmiş oluruz. İsrafın tanımı sadece bu kadar da değildir. Bir düşünüre göre ise israf başkasının hakkını yemektir. İhtiyacımızdan fazlasını kullanınca başka insanların hakkını tüketiriz. Kısacası israfın birçok anlamı vardır ama israf etmemek için tek yol ihtiyacımız kadar harcamaktır.",
    questions: [
      { id: 47, question: "47. Metne göre aşağıdaki cümlelerden hangisi doğrudur?", options: ["Zaman sınırsız bir kavramdır ve nasıl istersek öyle kullanabiliriz.", "İsraf etmek başkalarına zarar vermez, sadece bizim hayatımızı etkiler.", "Tanımı, kişiden kişiye değişse de israf bir şeyi ihtiyaçtan fazla tüketmektir.", "İsraftan kurtulmanın ve dengeli tüketmenin bir yöntemi henüz bulunmamaktadır."], correctAnswer: "Tanımı, kişiden kişiye değişse de israf bir şeyi ihtiyaçtan fazla tüketmektir." },
      { id: 48, question: "48. Metinde aşağıdaki sorulardan hangisinin cevabı yoktur?", options: ["Boş işler için yorulmak ve emek harcamak israf mıdır?", "Bir şeyi aşırı tüketmemiz diğer insanların hayatını etkiler mi?", "Zamanımızı doğru kullanmamanın hayatımıza bir zararı var mıdır?", "Kutsal kitaplara göre israf kavramının tanımı nedir?"], correctAnswer: "Kutsal kitaplara göre israf kavramının tanımı nedir?" }
    ]
  },
  {
    id: "group_b1_reading_2", level: "B1", type: "reading_group",
    instruction: "49. ve 50. soruya aşağıdaki metne göre cevap veriniz.",
    context: "Günümüzde neredeyse her gün stresli hissediyoruz. Bu stres durumu bazen kısa sürse de bazı durumlarda uzun süre hayatımızı etkiliyor. Özellikle büyük şehirlerde trafik, kalabalık, uzun iş saatleri stresimizi artırıyor. Fakat aslında stresin altındaki en büyük sebeplerden biri kaygı duygumuz. Kaygı, kötü bir şey yaşamaktan korkmak ve endişe hissetmek anlamına geliyor. Stresli olmamızın sebebi de ya işimizi ya sağlığımızı ya başarımızı ya da sevdiklerimizi kaybetme kaygımız.",
    questions: [
      { id: 49, question: "49. Stresli hissetmemizin en büyük sebebi büyük şehirlerde yaşamamızdır.", options: ["Doğru", "Yanlış"], correctAnswer: "Yanlış", type: "true_false" },
      { id: 50, question: "50. Kaygı gelecek olayları bilmemekten oluşur ve kötü deneyimler yaşamaktan, kaybetmekten korkmaktır.", options: ["Doğru", "Yanlış"], correctAnswer: "Doğru", type: "true_false" }
    ]
  },
  { id: 51, level: "B1", type: "multiple_choice", context: "İnsanoğlu dört yaşına kadar bütün dilleri edinip o dillerdeki tüm sesleri doğru bir biçimde telaffuz edebilir.", question: "51. Metne göre aşağıdaki cümlelerden hangisi yanlıştır?", options: ["İnsan, ana dilini doğar doğmaz çevresinden duyarak edinmeye başlar.", "İnsan, bir dili sürekli duyarsa her yaşta onu anadili gibi kullanabilir.", "İnsanların dil edinme şekli üzerine bazı araştırmalar bulunmaktadır.", "İnsan, lisedeyken yeni bir dil öğrenince o dildeki bazı harfleri yanlış söyleyebilir."], correctAnswer: "İnsan, bir dili sürekli duyarsa her yaşta onu anadili gibi kullanabilir." },

  // --- B1 Cloze Test (Aşağı Bakan Ok / Dropdown) ---
  {
    id: 52, level: "B1", type: "cloze_test",
    instruction: "52. Metinde bulunan boşluklara gelecek olan uygun şıkkı işaretleyiniz.",
    segments: [
      { text: "Hayat bize her zaman güneşli günler göstermiyor. Bazen hava bulutlanıyor, kapalı oluyor ve güneş, penceremizden içeri " },
      { id: "blank_52", options: ["girmiyor", "giremez", "girmemeli", "girmeyecek"], correctAnswer: "girmiyor" },
      { text: ". Diğer bir deyişle zor günler başlıyor." }
    ]
  },
  { id: 53, level: "B1", type: "multiple_choice", question: "53. En yakın şubemize ____ teknik destek alabilirsiniz.", options: ["gelerek", "gelip", "gelmeden", "gelince"], correctAnswer: "gelerek" },
  { id: 54, level: "B1", type: "multiple_choice", question: "54. Dün akşam tam giyinip evden ____ Aysel aradı.", options: ["çıkıyordum ki", "çıktım", "çıkarken", "çıkınca"], correctAnswer: "çıkarken" },
  { id: 55, level: "B1", type: "multiple_choice", question: "55. Mesela artık her sabah ütü yapmak ____", options: ["zorunda değilim", "istemiyorum", "yasak", "yok"], correctAnswer: "zorunda değilim" },
  { id: 56, level: "B1", type: "multiple_choice", question: "56. Eğer bir hayvan ____ bence kesin karınca olurdun.", options: ["olsaydın", "olursan", "ol", "olacaksın"], correctAnswer: "olsaydın" },
  { id: 57, level: "B1", type: "multiple_choice", question: "57. Bu akşam o korku filmini ____", options: ["izlemeseydim", "izlemedim", "izlemeyeceğim", "izlemem"], correctAnswer: "izlemeseydim" },
  { id: 58, level: "B1", type: "multiple_choice", question: "58. Belki tanıdık biri görürüm diye etrafına ____ ama kimseyi bulamadı.", options: ["bakındı", "baktı", "bakıyor", "bakacak"], correctAnswer: "bakındı" },

  // --- B1 Dinleme ---
  {
    id: "group_b1_listening_1", level: "B1", type: "audio_group",
    instruction: "Dinlediğiniz metne göre 59-61. sorulara cevap veriniz.",
    mediaUrl: "/assets/b1-dinleme1.mp3", mediaType: "audio",
    questions: [
      { id: 59, question: "59. Dinlediğiniz metne göre şeker hakkında aşağıdakilerden hangisi yanlıştır?", options: ["İnsan vücudunun saf şekere ihtiyacı yoktur.", "Şeker, obezite gibi birçok hastalığa sebep olur.", "Şeker, gerekli bir enerji kaynağıdır.", "Şeker, fazla tüketilirse zehir etkisi yapar."], correctAnswer: "Şeker, gerekli bir enerji kaynağıdır." },
      { id: 60, question: "60. Dinlediğiniz metne göre aşağıdaki hastalıklardan hangisinin sebebi şeker değildir?", options: ["migren", "aşırı zayıflık", "akciğer kanseri", "diyabet"], correctAnswer: "aşırı zayıflık" }
    ]
  },
  { id: 61, level: "B1", type: "multiple_choice", mediaType: "audio", mediaUrl: "/assets/b1-dinleme1.mp3", question: "61. Dinlediğiniz metne göre aşağıdakilerden hangi doğrudur?", options: ["Bütün uzmanlara göre şekeri tamamen bırakmamız gerekmektedir.", "Şeker tüketimi insanların sağlığını sadece fiziksel olarak etkiler.", "Şeker diğer besin kaynakları ile birlikte enerji kaynağı haline gelir.", "Tatlı yaparken şeker yerine başka bir gıda maddesi koyamayız."], correctAnswer: "Şeker diğer besin kaynakları ile birlikte enerji kaynağı haline gelir." },
  { id: "group_b1_listening_2", level: "B1", type: "audio_group", instruction: "Dinlediğiniz metne göre 62 ve 63. soruya cevap veriniz.", mediaUrl: "/assets/b1-dinleme2.mp3", mediaType: "audio", questions: [{ id: 62, question: "62. Kız, gece uyurken bir ses durunca uyanmış ve evde yabancı bir kişi ile karşılaşmış.", options: ["Doğru", "Yanlış"], correctAnswer: "Yanlış", type: "true_false" }, { id: 63, question: "63. Kızın yeni ev arkadaşından özür dilemesinin sebebi istemeyerek ona zarar vermesidir?", options: ["Doğru", "Yanlış"], correctAnswer: "Doğru", type: "true_false" }] },


  // ==========================================
  // B2 SEVİYESİ (Soru 64 - 83)
  // ==========================================

  // --- B2 Okuma ---
  {
    id: "group_b2_reading_1", level: "B2", type: "reading_group",
    instruction: "64. ve 65. soruya aşağıdaki metne göre cevap veriniz.",
    context: "Cep telefonumuza gün içinde bir sürü bildirim geliyor ve bunların birçoğu gereksiz bildirimlerden oluşuyor... Telefonlardan yayılan radyasyon kısa süre içinde baş ağrısına, uzun sürede de beyin fonksiyonlarınız üzerinde olumsuz etkilere neden olur. Bu sebeple günde dört beş saat telefonda konuşan insanlar akıllı saat kullanımına yönelmişlerdir.",
    questions: [
      { id: 64, question: "64. Metne göre saatlerle ilgili aşağıdaki bilgilerden hangisi yanlıştır?", options: ["Sadece uzun süre telefonda konuşan insanlar içindir.", "Telefonunuza gelen bildirimleri görebilirsiniz.", "Aramalara cevap verebilirsiniz.", "Fazla radyasyona maruz kalmanızı engeller."], correctAnswer: "Sadece uzun süre telefonda konuşan insanlar içindir." },
      { id: 65, question: "65. Uzun süre telefonda konuşan insanların akıllı saat kullanmak istemelerinin sebebi nedir?", options: ["telefon kullanmak istememeleri", "telefonda uzun süre konuşmak istememeleri", "telefondaki radyasyona maruz kalmak istememeleri", "sosyal medyadan uzak kalmak istemeleri"], correctAnswer: "telefondaki radyasyona maruz kalmak istememeleri" }
    ]
  },
  {
    id: "group_b2_reading_2", level: "B2", type: "reading_group",
    instruction: "66 - 68. sorulara aşağıdaki metne göre cevap veriniz.",
    context: "Uzaktan eğitimde, dersler zamandan ve mekandan bağımsız bir şekilde, öğrencilerin ve öğretim görevlilerinin okula gitmek zorunda kalmadan, internet bağlantısına sahip bir bilgisayar vasıtası ile işlenir... Uzaktan eğitimde öğretmen öğrenci arasındaki ilişki çok sağlıklı değildir ve aktif bir sınıf ortamı yoktur.",
    questions: [
      { id: 66, question: "66. Metne göre uzaktan eğitim nedir?", options: ["Kampüs ortamında ders anlatımıdır.", "Sanal ortamda ders anlatımıdır.", "Sınıf ortamında ders anlatımıdır.", "Yaşayan ortamda ders anlatımıdır."], correctAnswer: "Sanal ortamda ders anlatımıdır." },
      { id: 67, question: "67. Metne göre aşağıdakilerden hangisi uzaktan eğitimin özelliklerinden değildir?", options: ["Öğretmen merkezli bir sistemdir.", "Yenilikçi bir sistemdir.", "Akılcı bir sistemdir.", "Çağdaş bir sistemdir."], correctAnswer: "Öğretmen merkezli bir sistemdir." },
      { id: 68, question: "68. Metne göre aşağıdakilerden hangisi uzaktan eğitimin olumsuz özelliklerindendir?", options: ["zamandan tasarruf sağlaması", "derslerin tekrar tekrar izlenebilmesi", "sanal ortamda olması", "ilişkilerin pasif olması"], correctAnswer: "ilişkilerin pasif olması" }
    ]
  },
  { id: 69, level: "B2", type: "multiple_choice", question: "69. Sürekli bir şeyler atıştırmak istiyorsanız ____ meyveleri tercih edebilirsiniz.", options: ["kuru", "yaş", "ekşi", "tatlı"], correctAnswer: "kuru" },
  { id: 70, level: "B2", type: "multiple_choice", question: "70. Doping aldığı ortaya çıkınca ünlü koşucu yarışmadan ____", options: ["diskalifiye edildi", "ayrıldı", "atıldı", "çıktı"], correctAnswer: "diskalifiye edildi" },
  { id: 71, level: "B2", type: "multiple_choice", question: "71. Kira sözleşmesini yenilemeden önce ev sahibiyle günlerce ____", options: ["pazarlık ettik", "kavga ettik", "konuştuk", "anlaştık"], correctAnswer: "pazarlık ettik" },
  { id: 72, level: "B2", type: "multiple_choice", question: "72. Belki tanıdık biri görürüm diye etrafına ____ ama kimseyi bulamadı.", options: ["bakındı", "bakıyordu", "baktı", "bakmış"], correctAnswer: "bakındı" },
  { id: 73, level: "B2", type: "multiple_choice", question: "73. Son ____ kitabın özetini sana göndereceğim.", options: ["okuduğum", "okuyan", "okuduğu", "okumuş"], correctAnswer: "okuduğum" },
  { id: 74, level: "B2", type: "multiple_choice", question: "74. Dünkü sempozyumda ____ konu, Türkçenin yabancı dil olarak öğretimiydi.", options: ["ele alınan", "konuşulan", "tartışılan", "bahsedilen"], correctAnswer: "ele alınan" },
  { id: 75, level: "B2", type: "multiple_choice", question: "75. 'Arkadaşım saat 16.00'da geliyorum.' dedi. (Cümlenin dolaylı anlatımı hangisidir?)", options: ["Arkadaşım saat 16.00'da geleni söyledi...", "Arkadaşım saat 16.00'da gelmesini söyledi...", "Arkadaşım saat 16.00'da geldiğini söyledi...", "Arkadaşım saat 16.00'da geleceğini söyledi..."], correctAnswer: "Arkadaşım saat 16.00'da geleceğini söyledi..." },
  { id: 76, level: "B2", type: "multiple_choice", question: "76. Sanatçı ödül için konuşma ____ bayıldı.", options: ["yaparken", "yapıp", "yapınca", "yaparak"], correctAnswer: "yaparken" },
  { id: 77, level: "B2", type: "multiple_choice", question: "77. Üst üste üç maçtır yeniliyoruz. ____ maçlara çok iyi hazırlanıyor, sıkı antrenmanlar yapıyoruz.", options: ["Oysa", "Çünkü", "Bu yüzden", "Dolayısıyla"], correctAnswer: "Oysa" },
  { id: 78, level: "B2", type: "multiple_choice", question: "78. 'Cüzdanım yanımda, yolcuların birinden kart isteyip ücretini veririm.' diye düşündü ama ____", options: ["cüzdanı da yanında değildi.", "kartını buldu.", "şoför kızdı.", "otobüs boştu."], correctAnswer: "cüzdanı da yanında değildi." },

  // --- B2 Dinleme ---
  {
    id: "group_b2_listening_1", level: "B2", type: "audio_group",
    instruction: "Dinlediğiniz metne göre 79-81. sorulara cevap veriniz.",
    mediaUrl: "/assets/b2-dinleme1.mp3", mediaType: "audio",
    questions: [
      { id: 79, question: "79. Aşağıdakilerden hangisi Nostradamus'un yaptığı işlerden değildir?", options: ["eczacılık", "falcılık", "şifacılık", "astrologluk"], correctAnswer: "falcılık" },
      { id: 81, question: "81. Nostradamus'un mezarı nerededir?", options: ["bir kilisenin bahçesinde", "bir kilisenin duvarında", "evinin bahçesinde", "evinin duvarında"], correctAnswer: "bir kilisenin duvarında" }
    ]
  },


  // ==========================================
  // C1 SEVİYESİ (Soru 84 - 100)
  // ==========================================

  // --- C1 Okuma ---
  {
    id: "group_c1_reading_1", level: "C1", type: "reading_group",
    instruction: "84-86. sorulara aşağıdaki metne göre cevap veriniz.",
    context: "Ekolojik ev denilince akla genellikle çevreye dost materyallerden yapılmış, çevreye zarar vermeyen evler gelir... Hem kaliteli malzeme hem de minimalist anlayışla döşenmiş bu evler, normal evlerdeki gibi akıllı ev özelliklerine de sahip olabiliyor. Son yıllarda moda olan çevreci evler küçük olmak zorunda da değiller.",
    questions: [
      { id: 84, question: "84. Çevreci evler hem çevre bakımından hem de ekonomik bakımdan avantaj sağlar.", options: ["Doğru", "Yanlış"], correctAnswer: "Doğru", type: "true_false" },
      { id: 85, question: "85. Çevre dostu büyük evlere minimalist evler denilir.", options: ["Doğru", "Yanlış"], correctAnswer: "Yanlış", type: "true_false" },
      { id: 86, question: "86. Çevreci evler genellikle çok küçük alana sahipken akıllı evler oldukça büyük alana sahiptir.", options: ["Doğru", "Yanlış"], correctAnswer: "Yanlış", type: "true_false" }
    ]
  },
  { id: "group_c1_reading_2", level: "C1", type: "reading_group", instruction: "87 ve 88. sorulara metne göre cevap veriniz.", context: "Günümüzde saat görünümlü çok küçük bir cihazla sağlıkla ilgili birçok veriyi ölçmek mümkün. Akıllı saatler birçok kişiyi daha çok egzersiz yapmaya, uyku saatlerine dikkat etmeye itiyor.", questions: [{ id: 87, question: "87. Metinde aşağıdakilerden hangisine değinilmemiştir?", options: ["Akıllı saatlerle eşlenen telefonlara", "Akıllı saatlerin görünümüne", "Akıllı saatlerin sağlığa etkisine", "Akıllı saatlerin fonksiyonlarına"], correctAnswer: "Akıllı saatlerle eşlenen telefonlara" }, { id: 88, question: "88. Metne göre akıllı saatler ilgili hangisi doğrudur?", options: ["Akıllı saatler fazla tercih edilmezler.", "Akıllı saatler uyku düzeninizi değiştirebilir.", "Akıllı saat modelleri şık değil.", "Akıllı saat üreten firmaların sayısı azaldı."], correctAnswer: "Akıllı saatler uyku düzeninizi değiştirebilir." }] },
  { id: 89, level: "C1", type: "multiple_choice", question: "89. Korona virüsünün dünyamızı sonsuz kadar değiştirmesi bekleniyor... neredeyse tüm uçak seferlerini ____ virüs aslında ilk değil.", options: ["durduran", "etkileyen", "başlatan", "artıran"], correctAnswer: "durduran" },
  { id: 90, level: "C1", type: "multiple_choice", question: "90. Dünyanın seri üretime geçecek ilk uçan arabası Miami'de tanıtıldı. Uçan arabaya talebin yoğun olduğu henüz bu model üretilmeden önce ____.", options: ["biliniyordu", "bilinmişti", "bilinecek", "bilinir"], correctAnswer: "biliniyordu" },
  { id: 91, level: "C1", type: "multiple_choice", question: "91. Bu elbiseyi giymek ____ biraz kilo vermen lazım.", options: ["için", "gibi", "kadar", "göre"], correctAnswer: "için" },
  { id: 92, level: "C1", type: "multiple_choice", question: "92. Beni ____ söyle, boşu boşuna konuşmayayım.", options: ["dinlemeyeceksen", "dinlemezsen", "dinlemeyip", "dinlemeden"], correctAnswer: "dinlemeyeceksen" },
  { id: 93, level: "C1", type: "multiple_choice", question: "93. Sınav bir ay sonra. ____ bu kadar kısa bir zamanda sınava hazırlanmanız zor.", options: ["Halbuki", "Yani", "Oysa", "Çünkü"], correctAnswer: "Yani" },
  { id: 94, level: "C1", type: "multiple_choice", question: "94. Seni ____ bu kötü olaylarla karşılaşmazdım.", options: ["dinleseydim", "dinlemeseydim", "dinlersem", "dinlemişsem"], correctAnswer: "dinleseydim" },
  { id: 95, level: "C1", type: "multiple_choice", question: "95. Bundan sonra beni dinlemelisin.. ____ yine benzer hataları yaparsın.", options: ["Aksi takdirde", "Bununla birlikte", "Üstelik", "Hatta"], correctAnswer: "Aksi takdirde" },

  // --- C1 Dinleme (Final) ---
  {
    id: "group_c1_listening_1", level: "C1", type: "audio_group",
    instruction: "Dinlediğiniz metne göre 96-100. sorulara cevap veriniz.",
    mediaUrl: "/assets/c1-dinleme.mp3", mediaType: "audio",
    questions: [
      { id: 96, question: "96. Menengiç Güneydoğu Anadolu bölgesi şehirlerinden başka yerde yetişmez.", options: ["Doğru", "Yanlış"], correctAnswer: "Doğru", type: "true_false" },
      { id: 97, question: "97. Menengiç aslında bir kahve değil meyve türüdür.", options: ["Doğru", "Yanlış"], correctAnswer: "Doğru", type: "true_false" },
      { id: 98, question: "98. Menengiç kahvesi sindirim sistemi için yararlı olabilir.", options: ["Doğru", "Yanlış"], correctAnswer: "Doğru", type: "true_false" },
      { id: 99, question: "99. Menengiç kahvesiyle ilgili aşağıdakilerden hangisi söylenemez?", options: ["Sütlü ya da sütsüz yapmak mümkündür.", "Yapmak Türk kahvesi yapmak gibidir.", "Sert kahve sevenlere göre değildir.", "Soğuk olarak da tüketilebilen bir içecek türüdür."], correctAnswer: "Soğuk olarak da tüketilebilen bir içecek türüdür." },
      { id: 100, question: "100. Menegiç kahvesi aşağıdaki sağlık sorunlarından hangisine iyi gelmez?", options: ["solunum problemlerine", "kalp hastalıklarına", "yaşlanma etkilerine", "uyku problemlerine"], correctAnswer: "uyku problemlerine" }
    ]
  }
];