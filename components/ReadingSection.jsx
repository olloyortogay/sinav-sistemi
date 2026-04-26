'use client';

import { useEffect, useMemo, useState } from 'react';

function extractChoiceLetter(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).toUpperCase();
  const match = text.match(/[A-J]/);
  return match ? match[0] : null;
}

function levelFromScore(score) {
  let level = 'A1';
  if (score >= 21 && score <= 40) level = 'A2';
  else if (score >= 41 && score <= 60) level = 'B1';
  else if (score >= 61 && score <= 80) level = 'B2';
  else if (score >= 81 && score <= 100) level = 'C1';
  return level;
}

// Cevap anahtarı (görselden alınan sıra): 1..35
const readingAnswerKey = {
  1: 'B',
  2: 'C',
  3: 'E',
  4: 'A',
  5: 'F',
  6: 'D',
  7: 'I',
  8: 'D',
  9: 'A',
  10: 'F',
  11: 'G',
  12: 'C',
  13: 'B',
  14: 'H',
  15: 'B',
  16: 'C',
  17: 'G',
  18: 'E',
  19: 'F',
  20: 'D',
  21: 'C',
  22: 'B',
  23: 'A',
  24: 'C',
  25: 'B',
  26: 'C',
  27: 'A',
  28: 'B',
  29: 'B',
  30: 'C',
  31: 'B',
  32: 'D',
  33: 'D',
  34: 'B',
  35: 'C',
};

// Reading Data (passages + questions)
const readingData = {
  passages: [
    {
      id: 'p1',
      title: '1. Okuma Metni — Takvimler (1-6)',
      content: [
        'Batıl inançlar, bilimsel bir temele dayanmayan, ancak birçok insanın günlük yaşamında etkili olan inanışlardır. Tarih boyunca insanlar, doğa olaylarını ve açıklayamadıkları durumları __________ (S1) güçlerle ilişkilendirmişlerdir. Bu inançlar, nesilden nesle aktarılmış ve bazıları günümüzde bile varlığını sürdürmektedir.',
        'En yaygın batıl inançlardan biri, kara kedinin önünden geçmesinin __________ (S2) getireceğine inanılmasıdır. Bunun kökeni Orta Çağ’a dayanır; o dönemde kara kedilerin cadılarla ilişkilendirildiği düşünülürdü.',
        'Batıl inançlar sadece kötü şansla ilgili değildir; bazıları iyi şans getirdiğine inanılan ritüelleri de içerir. Örneğin, nazar boncuğu takmak, kişiyi kötü enerjilerden koruduğuna inanılan yaygın bir gelenektir. Nazar inancı, eski Türk kültürüne dayansa da, günümüzde Türkiye\'nin ________ (S3) birçok farklı kültürde de yaygındır.',
        'Batıl inançların insanlar üzerindeki etkisi oldukça __________ (S4). Özellikle önemli kararlar alınırken ya da yeni bir işe başlanırken bu inançlar dikkate alınabilir. Örneğin, yeni bir eve taşınmadan önce eve tuz dökmenin kötü ruhları uzaklaştıracağına inanılır. Benzer şekilde, merdiven altından geçmenin kötü şans getirdiğine dair inanış da hâlâ birçok insan tarafından dikkate alınmaktadır.',
        'Günümüzde bilimin ilerlemesiyle batıl inançların _______ (S5) alanı azalmış olsa da, bu ________ (S6) inançlar kültürel mirasın bir parçası olarak yaşamaya devam etmektedir. İnsanların açıklayamadıkları olaylara karşı geliştirdikleri bu inanışlar, zamanla toplumların kimliklerinin bir parçası hâline gelmiştir.',
      ],
      questions: [
        { no: 1, prompt: 'Boşluk (1)', type: 'mc', options: ['A) derin', 'B) doğaüstü', 'C) kademsizlik', 'D) çeşit', 'E) yanı sıra', 'F) etki', 'G) köylerinde', 'H) yüzeysel'] },
        { no: 2, prompt: 'Boşluk (2)', type: 'mc', options: ['A) derin', 'B) doğaüstü', 'C) kademsizlik', 'D) çeşit', 'E) yanı sıra', 'F) etki', 'G) köylerinde', 'H) yüzeysel'] },
        { no: 3, prompt: 'Boşluk (3)', type: 'mc', options: ['A) derin', 'B) doğaüstü', 'C) kademsizlik', 'D) çeşit', 'E) yanı sıra', 'F) etki', 'G) köylerinde', 'H) yüzeysel'] },
        { no: 4, prompt: 'Boşluk (4)', type: 'mc', options: ['A) derin', 'B) doğaüstü', 'C) kademsizlik', 'D) çeşit', 'E) yanı sıra', 'F) etki', 'G) köylerinde', 'H) yüzeysel'] },
        { no: 5, prompt: 'Boşluk (5)', type: 'mc', options: ['A) derin', 'B) doğaüstü', 'C) kademsizlik', 'D) çeşit', 'E) yanı sıra', 'F) etki', 'G) köylerinde', 'H) yüzeysel'] },
        { no: 6, prompt: 'Boşluk (6)', type: 'mc', options: ['A) derin', 'B) doğaüstü', 'C) kademsizlik', 'D) çeşit', 'E) yanı sıra', 'F) etki', 'G) köylerinde', 'H) yüzeysel'] },
      ],
    },
    {
      id: 'p2',
      title: '2. Okuma Metni — Durumlar (7-14)',
      content: [
        'Durumlar (A–J):',
        'A) Baytar olarak çalışmak istiyorsunuz.',
        'B) Aracınızda bir arıza var, onarmak istiyorsunuz.',
        'C) Kangalınız kuduz olduğunda, sorunu çözmek istiyorsunuz.',
        'D) Bir yakınınız, yeni ve cazip bir apartmanda bir daire kiralamak istiyor.',
        'E) Evinizi tamir etmek istiyorsunuz.',
        'F) Evinizin duvarlarını boyatmak istiyorsunuz.',
        'G) Gece yarısı kızınız dental implant ağrısıyla uyandı.',
        'H) Komşunuz, özel bir yemek masası yaptırmak istiyor.',
        'I) İstanbul’da sakin ve yeşil bir ortamda yeni bir daire satın almak istiyorsunuz.',
        'J) Lazerle göz estetik yöntemleri hakkında bilgi almak istiyorsunuz.',
        '',
        'Bilgi metinleri:',
        '',
        'S7',
        'İSTANBUL-SİLİVRİSARAY EVLERİ',
        'Silivrisaray Evleri; denize sıfır konumu, büyük bahçeleri, temiz havası, güvenli, huzurlu ve keyifli ortamıyla sakinlerine yeni bir daireden ziyade, yeni bir yaşam vaat ediyor.',
        'Satılık Dairelerin Teslim Tarihi: Hemen',
        'Daire Sayısı: 86',
        'Toplam Proje Alanı: 20.000 m2',
        'İletişim Bilgileri:',
        'Tel .: 0 (212) 728 05 32',
        'Satış Ofisi: Fatih Mahallesi Bağlar Sokak No:2 Silivri/İSTANBUL',
        'www.silivrisaray.com',
        '',
        'S8',
        'SARİSSA İSTANBUL',
        '"Sarissa İstanbul" adı, üç bloğun birbirine bir kuşakla sarılmış gibi bağlandığı mimarisiyle özdeşleşmiştir. 14.000 m2 üzerinde biri saray konut, toplam beş blok ve 398 kiralık konuttan oluşan Sarissa İstanbul, işlevselliği ve eşsiz estetik tasarımıyla her anını keyifle yaşayacağınız bir kent ...',
        'İletişim Bilgileri:',
        'Telefonlar: 0 (216) 415 13 10 - 0 (216) 415 13 08',
        'Temas Ofisi: Turcan Caddesi Hisar Sokak No:10 34775 Ümraniye/İSTANBUL',
        'Internet adresi: (http://)www.sarissa.com.tr',
        'İlgili Kişi: Işıl Vaizoğlu',
        '',
        'S9',
        'Hayvan hastanemize tecrübeli ya da tecrübesiz bayan veteriner hekim ve bayan veteriner sağlık teknisyenleri alınacaktır.',
        'Çalışma Şekli: Tam Zamanlı',
        'Cinsiyet / Yaş: Bayan / 20-35 Yaş',
        '',
        'Gold Dog Hospital',
        'Ferdi Uludağ',
        'Tel .: 0 (212) 6625510',
        'E-posta: ferdiuludag@hotmail.com',
        '',
        'S10',
        'Binalarınızın dışında yapacağımız uygulama ile birlikte nem ve rutubet problemlerinize kesin çözümler getirmekteyiz.',
        'Ayrıntılı bilgi için bizleri arayın, tanıtım elemanlarımız ve teknik personelimiz sizleri bilgilendirsinler.',
        '',
        'ASA-MAR İnşaat',
        'Cihangir/İSTANBUL',
        'Tel. ve Fax: 0 (232) 463 48 68 (Pbx)',
        'Şube: 0 (232) 254 53 53',
        '',
        'S11',
        '(S11 yok)',
        '',
        'S12',
        'İstanbul MERKEZ VETERİNER KLİNİĞİ',
        '1996 yılında kurulmuş olan Merkez Veteriner Kliniği, Erdal Çalışkan ve Mehmet Çevik ortaklığı olup alanında bölgemizin lider kuruluşudur.',
        '',
        'Ürün ve Hizmetleri Hakkında:',
        '· Tüm evcil hayvanların tedavileri',
        '· Veteriner ilaçları satışı (hayvan sağlığında kullanılan tüm ürünler)',
        '· Köpek ve kedi mamaları',
        '· Dezenfektanlar - hijyen ürünleri',
        '· Koruyucu aşılamalar - ilaçlamalar',
        '· Koruyucu hekimlik, danışmanlık',
        'Tel .: 0 (282) 260 49 91',
        '',
        'S13',
        'Turay Oto Tamir, Bakım ve Yardım',
        'Her türlü araç tamir ve bakımı itinayla yapılır.',
        'Yol yardım hizmetimiz ile 12-24 ve haftanın 7 günü hizmetinizdeyiz.',
        'Yolda kaldığınız zaman Muhittin Usta\'ya ulaşın! Nerede olursanız olun, Muhittin olunca korkmanıza gerek yok!',
        '',
        'Istanbul',
        'Tel .: 0 (212) 347 98 25',
        '',
        'S14',
        'Ahşap Dekorasyon İstanbul',
        'İsteklerinize uygun, her konuma hitap eden; kaliteli, garantili, estetik, tatmin edici ve en ince noktaya kadar dikkatle hazırladığımız ahşap ürünlerini sizlere sunuyoruz.',
        '',
        'Bize ulaşmak çok kolay!',
        'Hemen 0 536 540 97 84 numaralı telefonumuzdan bilgi alabilirsiniz.',
      ],
      questions: [
        { no: 7, prompt: 'S7 metni için uygun durum', type: 'mc', options: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'] },
        { no: 8, prompt: 'S8 metni için uygun durum', type: 'mc', options: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'] },
        { no: 9, prompt: 'S9 metni için uygun durum', type: 'mc', options: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'] },
        { no: 10, prompt: 'S10 metni için uygun durum', type: 'mc', options: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'] },
        { no: 11, prompt: 'S11 metni için uygun durum', type: 'mc', options: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'] },
        { no: 12, prompt: 'S12 metni için uygun durum', type: 'mc', options: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'] },
        { no: 13, prompt: 'S13 metni için uygun durum', type: 'mc', options: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'] },
        { no: 14, prompt: 'S14 metni için uygun durum', type: 'mc', options: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'] },
      ],
    },
    {
      id: 'p3',
      title: '3. Okuma Metni — Olimpiyat Oyunları 2024 (15-20)',
      content: [
        'I. Paris 2024 Olimpiyat Oyunları, modern olimpiyat tarihinin en önemli etkinliklerinden biri olarak kabul ediliyor. Bu oyunlar, Paris’in üçüncü kez ev sahipliği yaptığı oyunlar olarak tarihe geçecek. Ancak Paris 2024, sadece tarihi bir olay olmanın ötesinde, yenilikçi yaklaşımları ve çevre dostu projeleriyle de dikkat çekiyor. Sürdürülebilirlik, oyunların merkezinde yer alıyor ve kullanılan malzemelerin büyük çoğunluğu geri dönüştürülebilir olacak şekilde tasarlandı. Olimpiyat Köyü, enerji verimliliği göz önünde bulundurularak inşa edildi ve oyunlar sırasında çevreye verilen zararın minimuma indirgenmesi hedeflendi. Paris 2024, bu anlamda sadece bir spor etkinliği değil, aynı zamanda gelecekteki uluslararası organizasyonlara örnek teşkil edecek bir model olarak da görülüyor.',
        'II. Paris 2024, yenilikçi spor dallarını olimpiyatlara ekleyerek genç kuşağın ilgisini çekmeye çalışıyor. Özellikle tırmanış, kaykay, sörf gibi sporlar, olimpiyat tarihinde ilk kez resmi birer branş olarak yer alacak. Bu yenilikler, olimpiyat ruhunu korurken aynı zamanda oyunların gençler arasında popülerliğini artırmayı hedefliyor. Paris 2024, bu anlamda sadece geleneksel sporları değil, aynı zamanda gençlerin tutkuyla ilgilendiği sporları da kucaklıyor. Bu yeniliklerin olimpiyat oyunlarının evriminde nasıl bir rol oynayacağı, ilerleyen yıllarda daha net görülecek.',
        'III. Özbekistan, Paris 2024 Olimpiyatları’nda madalya sıralamasında önemli bir yer edinmeyi hedefliyor. Özellikle boks, judo ve halter gibi branşlarda başarı gösteren Özbek sporcular, Tokyo 2020’de elde ettikleri başarıyı Paris’te sürdürmeyi planlıyor. Tokyo\'da altın madalya kazanan halterci Akbar Djuraev, Paris’te de büyük bir başarı elde etmeyi amaçlıyor. Bahodir Jalolov, boks dalında Tokyo’daki altın madalyasının ardından Paris\'te unvanını korumak için mücadele edecek. Ayrıca, Özbekistan judo takımı da Paris 2024’te madalya için mücadele edecek. Özbekistan, sporculara yaptığı yatırımlarla dikkat çekiyor ve olimpiyatlardaki varlığını güçlendirmeyi amaçlıyor.',
        'IV. Paris 2024 Olimpiyat Köyü, sporcuların hem fiziksel hem de mental olarak rahat etmeleri için özel olarak tasarlandı. Köyde kullanılan malzemeler tamamen geri dönüştürülebilir olup, enerji verimliliği göz önünde bulundurularak inşa edildi. Sporcuların dinlenmesi ve sosyal aktivitelerde bulunması için özel alanlar yaratıldı. Ayrıca, Paris’in kültürel zenginlikleriyle iç içe olan bu köy, sporculara eşsiz bir olimpiyat deneyimi sunmayı hedefliyor. Sporcular, yarışlardan arta kalan zamanlarında Paris\'in tarihi dokusunu keşfetme imkânına sahip olacak. Bu sayede, sadece fiziksel olarak değil, aynı zamanda kültürel anlamda da zengin bir deneyim yaşamaları sağlanacak.',
        'V. Olimpiyat Oyunları, sadece bir spor etkinliği değil, aynı zamanda kültürlerarası etkileşimin ve barışın sembolüdür. Paris 2024, bu mirası sürdürerek dünya genelinden sporcuları ve izleyicileri bir araya getirecek. Farklı kültürlerin buluştuğu bu platformda, spor aracılığıyla dayanışma ve dostluk ilişkileri güçleniyor. Paris’in tarihi atmosferi, oyunlara ev sahipliği yaparken, olimpiyat ruhunu daha da anlamlı kılıyor. Olimpiyatların evrensel dili, farklı ülkelerden gelen sporcuları bir araya getirerek küresel dayanışmanın en büyük göstergelerinden biri olarak kabul ediliyor. Paris 2024, bu anlamda olimpiyatların sosyal etkilerini derinlemesine hissettirecek bir etkinlik olacak.',
        'VI. Paris 2024 Olimpiyatları, Özbek sporcular için bir başarı sahnesi olacak. Özellikle genç sporcuların dikkat çekici performansları, ülkenin spor alanındaki büyümesini simgeliyor. Halterde Akbar Djuraev, boks dalında Bahodir Jalolov ve judoda Diyorbek Urozboev gibi sporcular, madalya umutlarını canlı tutuyor. Özbekistan’ın Paris’teki performansı, ülkenin spora yaptığı yatırımların ve genç yeteneklerin keşfinin ne denli önemli olduğunu gösteriyor. Özbek sporcuların bu başarısı, gelecek nesillere ilham verecek nitelikte ve olimpiyat oyunları tarihinde kalıcı bir iz bırakacak.',
      ],
      metaTable: {
        left: ['S15. I. paragraf', 'S16. II. paragraf', 'S17. III. paragraf', 'S18. IV. paragraf', 'S19. V. paragraf', 'S20. VI. paragraf'],
        right: [
          'A) Özbekistan’da Olimpiyat Ruhunun Modern Spor Üzerindeki Etkileri',
          'B) Paris 2024’te Sürdürülebilirlik Projelerinin Rolü',
          'C) Yeni Kuşağı Meraklandıran Spor Dalları',
          'D) Genç Sporcuların Olimpik Başarı Dinamikleri',
          'E) Sunulan Yeni Olanaklar',
          'F) Sporun Toplumlararası İlişkilere Etkisi',
          'G) Özbekistan’ın Paris 2024’teki Hedefleri',
          'H) Yenilikçi Olimpiyat Stratejileri',
        ],
      },
      questions: [
        { no: 15, prompt: 'I. paragraf için başlık', type: 'mc', options: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] },
        { no: 16, prompt: 'II. paragraf için başlık', type: 'mc', options: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] },
        { no: 17, prompt: 'III. paragraf için başlık', type: 'mc', options: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] },
        { no: 18, prompt: 'IV. paragraf için başlık', type: 'mc', options: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] },
        { no: 19, prompt: 'V. paragraf için başlık', type: 'mc', options: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] },
        { no: 20, prompt: 'VI. paragraf için başlık', type: 'mc', options: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] },
      ],
    },
    {
      id: 'p4',
      title: '4. Okuma Metni — Halk Oyunları ve Dans (21-29)',
      content: [
        'Dünya tek bir hareketle ortaya çıktı. Sonra bu ilk hareket bir ritim tutturdu, insanlık tarihi boyunca renklerini değiştirerek, kendini geliştirerek varlığını sürdürmeye devam etti. Yeryüzünde hareketin başladığı andan itibaren insanın içinde bu ritim aslında hep vardı. İlk insanlar önce tepindiler, ellerini çırptılar ve çıkan seslere kulak vererek yaptıkları hareketleri anlamaya çalıştılar.',
        'Dansın en ilkel hâli, Neolitik Çağ insanlarının hareketlerinde saklı değil mi? Avlayacağı hayvanın neye benzediğini, nasıl saldırdığını, koştuğunu, atlayıp zıpladığını taklit yoluyla anlatmaya çalışan ilk insanlar, dansın en ilkel hâlini sergilemiyorlar mıydı? İnsanın gökyüzüyle dansına ne demeli? Gökyüzünün öfkeli bir gürültü ve ışık selinin arkasından, beklenmedik bir sürprizle yağmuru armağan etmesi veya büyük bir rüzgârla her şeyi silip süpürmesi, insanoğlunu hayrete düşürmüş.',
        'Tüm bu olanlar karşısında insan, heyecanını, korkularını veya sevincini beden hareketleriyle anlatma ihtiyacı duymuş ve dansın henüz adı konmadan ilk örnekleri ortaya çıkmıştır. Zaman içinde dinî törenler, tapınmalar ve ibadet biçimleri, ham hâldeki dansın gelişimine katkı sağlamıştır.',
        'Yinelediği ritmik hareketlerin doğaüstü etkileri olduğunu fark eden insan, her ritüelde bu gizemli gücü yeniden yarattığı duygusuna kapılmış, dansı büyülü kılmıştır. Antik Çağ’daki bir rahibin kollarını yukarı kaldırıp döne döne tanrılara yakarışı, Orta Asya’daki bir Şaman’ın, ateşin etrafında dönerek düşmanın uzaklaşması için tanrıdan yardım dileyişi, dansı ilkel olmaktan kurtarıp, ona bilinç ve gelişme kazandıran ilk örnekler arasında yer almıştır.',
        'Uygarlıklar geliştikçe, toplum hayatı ve toplum kuralları şekillendikçe, dansta da birtakım kurallar ortaya çıktı. Dansın, kuralları olan bir sanat olarak ortaya çıkışı, Rönesans Dönemi’ne dayanmaktadır. 16. yüzyılda Fransız ve İtalyan besteciler, yalnız dans için besteler yapmaya başladılar. Rönesans’ın bizlere kazandırdığı zarafetin dansı Bale insanları kendine hayran bırakarak dansın yolunu açtı.',
        'Tüm dünyaya hızla yayılan dans, o yıllarda bazı tabuları bile yıkacak güce ulaştı. Cüretkâr figürler içeren “Volta” dansını çok beğenen İngiltere Kraliçesi I. Elizabeth, bu beğenisiyle din adamlarını dehşete düşürdü.',
        'Fransız Devriminin getirdiği yeniliklerden dans sanatı da payına düşeni aldı. Dans tarihinin gönülleri fetheden türlerinden Viyana kökenli “Vals” ve Çek kökenli “Polka” bütün Batı’yı kasıp kavurdu. 19. yüzyılda, Brezilya’dan esen “Samba” rüzgârı ve Arjantin’in fakir işçi sınıfından doğan, hayal kırıklığı, asilik ve hırçınlığın dansı “Tango”, dans dünyasındaki ölümsüz yerlerini aldılar.',
        'II. Dünya Savaşı’ndan sonra dans, yeni dünyada yeniden kendi dünyasını kurdu. Dans salonları “Rock’n Roll” ve “Twist”le sallandı. Gençlerin kanını kaynatacak dansların ardı arkası kesilmedi. 20. yüzyılın ikinci yarısında, hızla gelişme gösteren ve çeşitlenen danslar birer uzmanlık alanı hâline gelerek büyük bir heyecan ve hevesle öğretilen-öğrenilen bir kimlik kazandı. Dans kursları açıldı.',
        'Danslar hangi müzikle icra ediliyorsa o isimle anılmaya, kategorilere ayrılmaya başlandı. Dans federasyonları kuruldu ve ülkeler arası dans şampiyonaları düzenlenmeye başlandı. Dansla ilgili dünyadaki tüm bu gelişmelerin, Türkiye’de de yansımalarını görebiliriz.',
        'Ancak Türk kültürü ve geleneklerinin hayat bulduğu dans türlerinin, bilhassa Anadolu’daki dansın, temelde üç ayrı kültür etkisinde kaldığı görülmektedir. Eski Anadolu uygarlıkları, Orta Asya’daki Şaman kültürü ve İslam dini, Anadolu’daki dans kültürünün oluşumuna etkide bulunmuşlardır. Bu bağlamda tek bir tarz ve biçimden bahsetmek oldukça zordur. İçinde bulunduğu çok kültürlülük ortamı dolayısıyla Türkiye’de dans, çok farklı görünümler sergilemektedir.',
        'Ege’de ağır ve mağrur bir duruş sergileyen “Zeybek”, Trakya’da dokuz sekizlik darbuka ritmiyle can bulan kıvrak figürlerle süslü “Roman Havası”, Karadeniz’de hızlı ve sert adımlarla oynanan “Horon”… Bunlar gibi daha niceleri, duyguların farklı dile getirilişinin örneklerini bizlere sunuyor. Vücut dili, kimi zaman tango, kimi zaman sambayla konuşuyor. Bazen bale, bazen de halayda hayat buluyor.',
        'Ama sonunda tüm danslar bir araya gelip 29 Nisan’da buluşuyor. Dans dünyasına büyük katkı sağlayan ünlü bir Fransız dansçı ve koreografın doğum günü olan bu tarih, 1982’den bu yana, tüm dünyada “Dünya Dans Günü” olarak kutlanıyor. İnsanlığın varoluşu ile ortaya çıkan ve günümüzün sevilen sanatları arasında gösterilen dans, ona eşlik eden müziği ile kulakların pasını silmiş, estetik ve ritmik hareketleri ile göz doldurmuştur.',
      ],
      questions: [
        { no: 21, prompt: 'Metne göre doğru seçenek', type: 'mc', options: ['A', 'B', 'C', 'D'] },
        { no: 22, prompt: 'Metne göre doğru seçenek', type: 'mc', options: ['A', 'B', 'C', 'D'] },
        { no: 23, prompt: 'Metne göre doğru seçenek', type: 'mc', options: ['A', 'B', 'C', 'D'] },
        { no: 24, prompt: 'Metne göre doğru seçenek', type: 'mc', options: ['A', 'B', 'C', 'D'] },
        { no: 25, prompt: 'DOĞRU / YANLIŞ / VERİLMEMİŞ', type: 'mc', options: ['A', 'B', 'C'] },
        { no: 26, prompt: 'DOĞRU / YANLIŞ / VERİLMEMİŞ', type: 'mc', options: ['A', 'B', 'C'] },
        { no: 27, prompt: 'DOĞRU / YANLIŞ / VERİLMEMİŞ', type: 'mc', options: ['A', 'B', 'C'] },
        { no: 28, prompt: 'DOĞRU / YANLIŞ / VERİLMEMİŞ', type: 'mc', options: ['A', 'B', 'C'] },
        { no: 29, prompt: 'DOĞRU / YANLIŞ / VERİLMEMİŞ', type: 'mc', options: ['A', 'B', 'C'] },
      ],
    },
    {
      id: 'p5',
      title: '5. Okuma Metni — E-Kitaplar (30-35)',
      content: [
        'A) İlk elektronik kitabın yayımlanmasının üzerinden yirmi yıldan fazla zaman geçti. İlk tepkiler olumsuz olsa da bazıları e-kitapların giderek yaygınlaşacağını, hatta klasik anlamda kitapların varlığını tehdit eder hâle gelebileceğini öngörmüştü. Araştırmalar ABD’de yetişkin nüfusun yarısının bir tablete ya da e-kitap okuyucusuna sahip olduğunu ve her 10 kişiden 3’ünün 2013’te e-kitap okuduğunu gösteriyor. Basılmış kitaplar hâlâ en yaygın okuma biçimi olsa da son 10 yılda e-kitap satışları daha hızla artıyor. İnternet üzerinden alışveriş yapmaya olanak sağlayan dev şirket Amazon’un 2007’de Kindle adlı e-kitap okuyucusunu piyasaya sürmesinin büyük payı var bunda. 2008-2010 yılları arasında e-kitap satışı yüzde 1260 arttı. Ardından Nook ve iPad meydana çıktı. İngiltere’nin ünlü kitapçılarından Borders Books 2011’de iflas etti. E-kitap satışları artmaya devam etti ama veriler bunun ilk dönemdeki kadar hızlı olmadığını gösteriyor.',
        'B) Amerikan Yayıncılar Derneği’ne göre kitap piyasasının yüzde 20’sini teşkil eden e-kitap satışları, 2015’te duraklama dönemine girdi. Fakat basılı kitapların satışında da bir düşüş olmuştu. Kitabın Geleceği Enstitüsü’nün kurucusu Robert Stein bu durağan çizginin bir gün yeniden yükselişe geçeceğini söylüyor. Stein, e-kitapların gelecekte yayınevleri tarafından değil, video oyunları sektörü tarafından üstlenebileceğine, kitap okumanın daha sosyal bir deneyim hâline geleceğine, yazarla okuyucunun dijital ortamda iletişim kurabileceğine inanıyor. Bu doğrultuda Stein “Sosyal Kitap” isimli bir projeyi hayata geçirdi. Stein’in “sosyal kitap projesi” dijital metinlerdeki satır aralarına okurun kendi yorumlarını yazmasına olanak veriyor. Bazı okullarda öğretmenler tartışmaları teşvik etmek için bu tür okuma yöntemlerini kullanıyor bile. Stein, “Gelecek kuşaklar açısından, kitap okumanın tek başına yapılan bir etkinlik olması fikri, oldukça yabancı gelecek.” diyor.',
        'C) Kitap basımının tümüyle ortadan kalkması beklenmiyor ama ilerleyen zamanlarda bunun da tıpkı el dokumacılığı, gümüş işlemeciliği gibi bir zanaata ya da estetik bir değere dönüşmesi tahmin ediliyor. Kitaplar, okumak için değil, daha çok bakmak için olacak. Kitaplar sanat kataloglarındaki ve sehpalardaki yerlerini koruyacak. Bazıları basılı kitabın 50-100 yıl içinde tümüyle ortadan kalkacağına inanıyor. Basılı kitabın ortadan kalkma ihtimali Massachusetts’teki Tufts Üniversitesi Okuma ve Dil Araştırma Merkezi başkanı Maryanne Wolf gibilerine ise endişe veriyor.',
        'D) Yapılan bazı araştırmalara göre elektronik okuma, beynin metne verdiği anlama ve yoğunlaşma gibi tepkileri olumsuz etkilemektedir. Basılı kitaplar üzerinden yapılan okuma etkinliğinde, insanların dikkatlerini kolayca kitaplara yönlendirebildikleri ancak ekran üzerinden yapılan okuma etkinliğinde insanların dikkatlerinin çabucak dağıldığı tespit edilmiştir. Kindle gibi e-kitap okuyucuların ise daha az dikkat dağıtıcı olduğu tespit edilmiştir. Wolf’a göre dijital araçlar derin okumalar yapabilmek için pek de uygun değildir. Wolf’a göre bu konuda detaylı okumak ve okunanlar üzerinde eleştirel düşünebilmek için bu araçlar pek de uygun değildir. Fakat bunun tersini gösteren araştırmalar da vardır. Buna göre, e-kitap okumak kavrayışı azaltmadığı gibi özellikle disleksi hastası kişilerin okumaktan daha fazla zevk almasını sağlayabilir.',
        'E) Kreşe giden 400’den fazla çocuk üzerinde yapılan deneylerde, çocukların animasyon içeren e-kitaplardaki hikâyeleri daha iyi anladığı ve bu hikâyelerden daha fazla kelime öğrendikleri görüldü. Wolf, ABD’de ve Avrupa’da çocukların elektronik cihazlarla fazla vakit geçirmelerinin sorunlu olduğunu kabul etmekle birlikte, gelişmekte olan ülkeler açısından bu cihazların bilginin demokratikleşmesini sağladığını belirtiyor. Her iki kitap türünün de toplum için korunması gerektiğini söyleyen Wolf, ABD’de son dönemlerde basılı kitap satışında artış yaşandığını belirtmektedir. Wolf, basılı kitapların değerinin son zamanlarda anlaşılmaya başlandığını dile getirmektedir.',
      ],
      questions: [
        { no: 30, prompt: 'Metne göre doğru seçenek', type: 'mc', options: ['A', 'B', 'C', 'D'] },
        { no: 31, prompt: 'Metinde değinilmeyen', type: 'mc', options: ['A', 'B', 'C', 'D'] },
        { no: 32, prompt: 'Metinden ulaşılamaz', type: 'mc', options: ['A', 'B', 'C', 'D'] },
        { no: 33, prompt: 'Hangi paragrafta?', type: 'mc', options: ['A', 'B', 'C', 'D', 'E'] },
        { no: 34, prompt: 'Hangi paragrafta?', type: 'mc', options: ['A', 'B', 'C', 'D', 'E'] },
        { no: 35, prompt: 'Hangi paragrafta?', type: 'mc', options: ['A', 'B', 'C', 'D', 'E'] },
      ],
    },
  ],
};

export default function ReadingSection({ onSubmit, disabled = false }) {
  const [activePassageId, setActivePassageId] = useState(readingData.passages[0].id);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(60 * 60);
  const [showExitWarning, setShowExitWarning] = useState(false);

  const activePassage = useMemo(
    () => readingData.passages.find((p) => p.id === activePassageId) || readingData.passages[0],
    [activePassageId]
  );

  const allQuestions = useMemo(
    () => readingData.passages.flatMap((p) => p.questions),
    []
  );

  const allAnswered = useMemo(
    () => allQuestions.every((q) => answers[q.no] !== undefined && answers[q.no] !== ''),
    [answers, allQuestions]
  );

  useEffect(() => {
    if (disabled) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const t = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, disabled]);

  function setAnswer(no, value) {
    setAnswers((prev) => ({ ...prev, [no]: value }));
  }

  function handleExitExam() {
    setShowExitWarning(false);
    setAnswers({});
    setTimeLeft(60 * 60);
    setActivePassageId(readingData.passages[0].id);
    onSubmit?.({ exited: true });
  }

  function handleSubmit() {
    if (disabled) return;

    const detailedResults = allQuestions.map((q) => {
      const user = answers[q.no];
      const userLetter = extractChoiceLetter(user) || (typeof user === 'string' ? user.toUpperCase() : null);
      const correct = readingAnswerKey[q.no] || null;
      const isCorrect = Boolean(userLetter && correct && userLetter === correct);
      return {
        questionId: q.no,
        questionText: `S${q.no}`,
        userAnswer: userLetter,
        correctAnswer: correct,
        isCorrect,
      };
    });

    const correctCount = detailedResults.filter((d) => d.isCorrect).length;
    const totalQuestionCount = detailedResults.length || 35;
    const score = Math.round((correctCount / Math.max(totalQuestionCount, 1)) * 100);
    const level = levelFromScore(score);

    onSubmit?.({
      sections: {
        exam_type: 'reading',
        answers,
        detailedResults,
        scoreSummary: { correctCount, totalQuestionCount },
      },
      score,
      level,
      correctCount,
      totalQuestionCount,
    });
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-24 z-30 bg-white border border-blue-100 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          <div className="flex w-full lg:w-auto gap-2">
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || disabled}
              className={`w-full lg:w-auto px-6 py-3 rounded-xl font-bold text-white transition ${!allAnswered || disabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
            >
              Okuma Sınavını Bitir
            </button>
            <button
              onClick={() => setShowExitWarning(true)}
              disabled={disabled}
              className={`w-full lg:w-auto px-6 py-3 rounded-xl font-bold text-white transition bg-red-600 hover:bg-red-700 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Sınavdan Çıkış
            </button>
          </div>

          <div className="text-sm font-semibold text-gray-700">
            Süre: {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
        </div>

        {showExitWarning ? (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3">
            <p className="text-sm font-semibold text-red-800">
              Sınavdan çıkarsanız mevcut işaretlemeleriniz silinecektir. Çıkmak istediğinize emin misiniz?
            </p>
            <div className="mt-2 flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleExitExam}
                className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700"
              >
                Evet, Çık ve Sil
              </button>
              <button
                onClick={() => setShowExitWarning(false)}
                className="flex-1 px-4 py-2 rounded-xl bg-white border font-bold hover:bg-gray-50"
              >
                Vazgeç
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {readingData.passages.map((p) => (
          <button
            key={p.id}
            onClick={() => setActivePassageId(p.id)}
            className={`px-4 py-2 rounded-xl font-bold text-sm border transition ${
              p.id === activePassageId ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {p.title}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border rounded-2xl p-5 lg:sticky lg:top-44 lg:max-h-[calc(100vh-220px)] overflow-y-auto">
          <h3 className="font-black text-gray-900 mb-3">{activePassage.title}</h3>

          {activePassage.metaTable ? (
            <div className="border rounded-xl overflow-hidden mb-4">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="align-top">
                    <td className="w-[40%] border-r p-3 bg-gray-50">
                      <div className="space-y-2">
                        {activePassage.metaTable.left.map((l) => (
                          <p key={l} className="font-bold">{l}</p>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="space-y-2">
                        {activePassage.metaTable.right.map((r) => (
                          <p key={r}>{r}</p>
                        ))}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : null}

          <div className="space-y-3 text-sm text-gray-800 leading-relaxed">
            {activePassage.content.map((p, idx) => (
              <p key={idx} className="whitespace-pre-line">{p}</p>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {activePassage.questions.map((q) => (
            <div key={q.no} className="bg-white border rounded-2xl p-5">
              <p className="font-bold text-gray-900 mb-3">
                S{q.no}. {q.prompt ? <span className="font-semibold text-gray-700">{q.prompt}</span> : null}
              </p>
              <div className="flex flex-wrap gap-2">
                {q.options.map((opt) => (
                  <label
                    key={`${q.no}-${opt}`}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer hover:bg-gray-50 ${
                      answers[q.no] === opt ? 'bg-blue-50 border-blue-200' : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${q.no}`}
                      checked={answers[q.no] === opt}
                      onChange={() => setAnswer(q.no, opt)}
                    />
                    <span className="font-semibold">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

