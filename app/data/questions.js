// ====================================================
// SORU BANKASI — Seviyeler birbirinden tamamen ayrı
// ====================================================
export const examBank = {

  // 1. BÖLÜM Soruları (B1 – Günlük Yaşam, kısa metin soruları)
  part1: [
    { question: "En korktuğunuz durum ne?" },
    { question: "Çocukluğunuzdaki en iyi arkadaşınız kimdi?" },
    { question: "Kendinizi kısaca tanıtır mısınız? En sevdiğiniz hobileriniz nelerdir?" },
    { question: "Gelecekte hangi mesleği yapmak istiyorsunuz ve neden?" },
    { question: "Eski bir hatıranızı anlatın. Unutamadığınız bir gün var mı?" },
    { question: "Spor yapmayı sever misiniz? Sizi nasıl hissettiriyor?" },
    { question: "Hayalinizdeki tatil yeri neresidir? Orada ne yapmak istersiniz?" },
    { question: "Boş zamanlarınızda en çok ne yapmaktan keyif alırsınız?" },
    { question: "Türkiye'de veya dünyada en çok gezmek istediğiniz şehir neresidir? Neden?" },
    { question: "Yemek yapmayı sever misiniz? En iyi yaptığınız yemek nedir?" },
    { question: "Herhangi bir enstrüman çalabiliyor musunuz? Veya çalmak ister misiniz?" },
    { question: "Günlük hayatta en sık kullandığınız teknolojik alet nedir?" },
    { question: "Hafta sonu planlarınızı genellikle nasıl yaparsınız?" },
  ],

  // 1.2. BÖLÜM Senaryoları (B1+ – Fotoğraf yorumlama, 3 alt sorudan oluşur)
  part1_2: [
    {
      image_url: "/variants/1.png",
      questions: [
        { q: "Bu resimlerde neler görüyorsunuz? Karşılaştırabilir misiniz?" },
        { q: "\"İyi ki okudum\" dediğiniz bir kitap var mı?" },
        { q: "Ailenizde daha çok kitap mı okunur, yoksa teknolojik aletler mi kullanılır?" },
      ],
    },
    {
      image_url: "/variants/2.png",
      questions: [
        { q: "Bu iki fotoğrafta neler görüyorsunuz? Karşılaştırabilir misiniz?" },
        { q: "Sabah insanı mısınız, yoksa gece mi daha verimli çalışırsınız?" },
        { q: "Günün hangi zaman dilimi daha yaratıcı bir çalışma ortamı sunar?" },
      ],
    },
    {
      image_url: "/variants/3.png",
      questions: [
        { q: "Bu resimlerde neler görüyorsunuz? Karşılaştırabilir misiniz?" },
        { q: "Arkadaşlarla ders çalışmanın avantajları nelerdir?" },
        { q: "Yalnız mı ders çalışmayı tercih edersiniz, yoksa arkadaşlarınızla mı?" },
      ],
    },
    {
      image_url: "/variants/4.png",
      questions: [
        { q: "Bu iki fotoğrafta neler görüyorsunuz? Karşılaştırabilir misiniz?" },
        { q: "Organik gıda ile işlenmiş gıda tüketiminin farkları nelerdir?" },
        { q: "Hangi tür gıdaları tercih edersiniz? Neden?" },
      ],
    },
    {
      image_url: "/variants/5.png",
      questions: [
        { q: "Bu resimlerde neler görüyorsunuz? Karşılaştırabilir misiniz?" },
        { q: "Yalnız seyahat etmek grup halinde seyahat etmeye göre üstünlük sağlar mı?" },
        { q: "Grup halinde seyahat etmek neden bazıları için daha eğlenceli olabilir?" },
      ],
    },
    {
      image_url: "/variants/6.png",
      questions: [
        { q: "Bu iki fotoğrafta neler görüyorsunuz? Karşılaştırabilir misiniz?" },
        { q: "Evcil hayvan sahibi olmanın avantajları ve zorlukları nelerdir?" },
        { q: "Neden bazı insanlar evcil hayvan beslemeyi sevmezler?" },
      ],
    },
    {
      image_url: "/variants/7.png",
      questions: [
        { q: "Bu resimlerde neler görüyorsunuz? Karşılaştırabilir misiniz?" },
        { q: "Boş zamanlarınızda arkadaşlarınızla şarkı söylemek için bir yerlere gider misiniz?" },
        { q: "Yalnızken şarkı söylemenin size ne tür faydaları olur?" },
      ],
    },
    {
      image_url: "/variants/8.png",
      questions: [
        { q: "Bu iki fotoğrafta neler görüyorsunuz? Karşılaştırabilir misiniz?" },
        { q: "Takım sporları ile bireysel sporlar arasındaki temel farklar nelerdir?" },
        { q: "Hangi tür sporu yapmaktan hoşlanırsınız?" },
      ],
    },
    {
      image_url: "/variants/9.png",
      questions: [
        { q: "Bu resimlerde neler görüyorsunuz? Karşılaştırabilir misiniz?" },
        { q: "Hangi cihazı daha çok kullanıyorsunuz: dizüstü bilgisayar mı masaüstü mü?" },
        { q: "Dizüstü bilgisayarın avantajları nelerdir?" },
      ],
    },
    {
      image_url: "/variants/10.png",
      questions: [
        { q: "Bu iki fotoğrafta neler görüyorsunuz? Karşılaştırabilir misiniz?" },
        { q: "Güneşli havayı mı, yağmurlu havayı mı tercih edersiniz? Neden?" },
        { q: "Yağmurlu hava size ne hissettiriyor?" },
      ],
    },
    {
      image_url: "/variants/11.png",
      questions: [
        { q: "Bu resimlerde neler görüyorsunuz? Karşılaştırabilir misiniz?" },
        { q: "Çayın, kahveye göre üstünlükleri nelerdir?" },
        { q: "Kahvenin size ne tür zararları olabilir?" },
      ],
    },
    {
      image_url: "/variants/12.png",
      questions: [
        { q: "Bu iki fotoğrafta neler görüyorsunuz? Karşılaştırabilir misiniz?" },
        { q: "Nasıl bir ailede büyüdünüz? Büyük ailede mi, çekirdek ailede mi?" },
        { q: "Sizce hangi aile yapısı insanlar için daha faydalıdır?" },
      ],
    },
    {
      image_url: "/variants/13.png",
      questions: [
        { q: "Bu resimlerde neler görüyorsunuz? Karşılaştırabilir misiniz?" },
        { q: "Gençlerin hangi özelliklerini beğenirsiniz?" },
        { q: "Yaşlılara saygı göstermek neden önemlidir?" },
      ],
    },
    {
      image_url: "/variants/14.png",
      questions: [
        { q: "Bu iki fotoğrafta neler görüyorsunuz? Karşılaştırabilir misiniz?" },
        { q: "Hastalandığınızda doğal bitkileri mi, ilaçları mı tercih ediyorsunuz?" },
        { q: "Doğal bitkilerle tedavi yöntemlerinin avantajları nelerdir?" },
      ],
    },
    {
      image_url: "/variants/15.png",
      questions: [
        { q: "Bu resimlerde neler görüyorsunuz? Karşılaştırabilir misiniz?" },
        { q: "Savaş ile barış arasındaki farklar nelerdir?" },
        { q: "İnsanlar için barış neden gereklidir?" },
      ],
    },
    {
      image_url: "/variants/16.png",
      questions: [
        { q: "Bu iki fotoğrafta neler görüyorsunuz? Karşılaştırabilir misiniz?" },
        { q: "Otobüsün, taksiye göre avantajları nelerdir?" },
        { q: "Neden bazı insanlar taksiyle yolculuk yapmayı tercih ediyor?" },
      ],
    },
    {
      image_url: "/variants/17.png",
      questions: [
        { q: "Bu resimlerde neler görüyorsunuz? Karşılaştırabilir misiniz?" },
        { q: "Sizce sıcak havanın ne tür olumsuz yönleri vardır?" },
        { q: "Hava soğuk olduğunda dışarı çıkmak ister misiniz?" },
      ],
    },
    {
      image_url: "/variants/18.png",
      questions: [
        { q: "Bu iki fotoğrafta neler görüyorsunuz? Karşılaştırabilir misiniz?" },
        { q: "Siz hangisini tercih edersiniz: eski model arabalar mı yoksa yeni model arabalar mı?" },
        { q: "Sizce aradan yıllar geçmesine rağmen eski model arabalar neden hâlâ değerli ve pahalı?" },
      ],
    },
    {
      image_url: "/variants/19.png",
      questions: [
        { q: "Bu resimlerde neler görüyorsunuz? Karşılaştırabilir misiniz?" },
        { q: "Akıllı saati mi yoksa geleneksel saati mi tercih ediyorsunuz?" },
        { q: "Sizce hangi saat daha kullanışlıdır: akıllı saat mi, geleneksel saat mi?" },
      ],
    },
    {
      image_url: "/variants/20.png",
      questions: [
        { q: "Bu iki fotoğrafta neler görüyorsunuz? Karşılaştırabilir misiniz?" },
        { q: "Yüz yüze eğitimde beğenmediğiniz yönler nelerdir?" },
        { q: "Hiç uzaktan eğitim aldınız mı?" },
      ],
    },
  ],

  // 2. BÖLÜM Senaryoları (B2 – Görsellerle madde maddeli tartışma)
  part2: [
    {
      image_url: "/images/hand_drawing_1776520211426.png",
      bullets: [
        "Hangi sanat alanını seviyorsunuz?",
        "Sizi nasıl etkiliyor?",
        "Sanat alanı daha çok eğlenceli olmalı mı yoksa eğitim odaklı mı?",
      ],
    },
    {
      image_url: "/images/robot_teaching_1776523987491.png",
      bullets: [
        "Eğitim sisteminde robotların ve yapay zekanın kullanılması hakkında ne düşünüyorsunuz?",
        "Gelecekte öğretmenlerin yerini alabilirler mi?",
        "Teknolojinin sınıflarda olmasının öğrencilere psikolojik etkileri neler olabilir?",
      ],
    },
    {
      image_url: "/images/virtual_reality_1776524002726.png",
      bullets: [
        "Sanal gerçeklik (VR) ortamlarında çok fazla vakit geçirmenin yararları ve zararları nelerdir?",
        "Bu teknoloji iletişim becerilerimizi nasıl etkiliyor?",
        "Gerçek dünyadan kopuşun modern toplum üzerindeki baskısına dair ne söylersiniz?",
      ],
    },
    {
      image_url: "/images/space_expl_1776524847790.png",
      bullets: [
        "İnsanlığın uzayı keşfetmesi ve kolonileşmesi size ne kadar inandırıcı geliyor?",
        "Uzay araştırmaları için harcanan bütçeler açlıkla mücadeleye ayrılsa daha mı faydalı olur?",
        "Dünya dışı bir yaşam formunun bulunması insanlık üzerinde nasıl bir etki yaratır?",
      ],
    },
    {
      image_url: "/images/remote_work_1776524864659.png",
      bullets: [
        "Uzaktan çalışma modelinin ofis çalışmasına göre avantajları nelerdir?",
        "Sürekli evden çalışmak insanların sosyalleşme yeteneğini azaltıyor mu?",
        "Gelecekte geleneksel ofis binalarının tamamen yok olacağına katılıyor musunuz?",
      ],
    },
    {
      image_url: "/images/climate_change_1776524881743.png",
      bullets: [
        "İklim değişikliği ve küresel ısınma sizce insanlığın en büyük problemi midir?",
        "Tek tek bireylerin geri dönüşüm yapması gerçekten dünyayı kurtarmaya yeter mi?",
        "Kuraklık konusunda devletlerin alması gereken acil önlemler neler olmalıdır?",
      ],
    },
    {
      image_url: "/images/auto_cars_1776524903835.png",
      bullets: [
        "Sürücüsüz (otonom) araçlara hayatınızı emanet eder misiniz? Neden?",
        "Sürücüsüz araçların yaygınlaşmasıyla şoförlük mesleğinin yok olması hakkında ne düşünüyorsunuz?",
        "Otonom araçların karıştığı kazalarda hukuki olarak kim suçlu kabul edilmelidir?",
      ],
    },
    {
      image_url: "/images/ai_art_1776524920076.png",
      bullets: [
        "Yapay zekanın sanat eserleri üretebilmesi insan yaratıcılığını değersizleştirir mi?",
        "Bir eserin 'Sanat' kabul edilmesi için mutlaka bir insan tarafından mı üretilmesi gerekir?",
        "Gelecekte bütün film senaryoları yapay zeka tarafından yazılırsa izler misiniz?",
      ],
    },
  ],

  // 3. BÖLÜM Soruları (C1 – Lehine/Aleyhine derinlemesine tartışma)
  part3: [
    {
      question: "Çocuklar erken yaşta doğru yanlışları bilmeleri toplum için önemli.",
      lists: {
        lehine: ["Erken yaştan hayata hazırlanıyorlar.", "Ebeveynler için kolaylık sağlar.", "Toplum için ileride vatanseverler yetişir."],
        aleyhine: ["Çocukların hayatı eğlenceli olmaz.", "Gerçek hayata olan bakış açıları değişir.", "Yanlış yaklaşım çocukları şefkatsiz büyümelerine neden olabilir."],
      },
    },
    {
      question: "Sosyal medyanın denetimsiz bırakılması ifade özgürlüğünün temel şartıdır.",
      lists: {
        lehine: ["Fikirlerin baskılanmasını önler.", "Hızlı bilgi paylaşımına izin verir.", "Demokratik tartışma ortamını besler."],
        aleyhine: ["Siber zorbalığı korkunç seviyelere ulaştırır.", "Yanlış bilginin (Fake News) yayılmasına sebep olur.", "Toplumsal kutuplaşmayı ve nefreti tetikler."],
      },
    },
    {
      question: "Üniversite eğitiminin tamamen ücretsiz ve herkese açık olması ideal toplum yaratmanın tek yoludur.",
      lists: {
        lehine: ["Ekonomik fırsat eşitsizliğini ortadan kaldırır.", "İnsanların temel hakkıdır.", "Toplumun genel eğitim seviyesini yükseltir."],
        aleyhine: ["Devletlerin üzerine devasa ekonomik yük bindirir.", "Mezun enflasyonu yaratıp diplomanın değerini düşürebilir.", "Kalabalıklar nedeniyle eğitim kalitesi düşebilir."],
      },
    },
    {
      question: "Hayvanlar üzerinde yapılan kozmetik ve tıbbi ilaç testleri tamamen yasaklanmalıdır.",
      lists: {
        lehine: ["Hayvanların yaşam hakkı güvence altına alınır.", "Alternatif biyomühendislik modelleri teşvik edilir.", "Zulüm engellenmiş olur."],
        aleyhine: ["Tıbbi aşı ve ilaç geliştirmeleri mecburen yavaşlar.", "Yeni ilaçların güvenilirliğinin ispatı zorlaşır.", "Salgınlara karşı reaksiyon süresi uzayabilir."],
      },
    },
    {
      question: "Devletlerin vatandaşlarının tüm dijital ayak izlerini güvenlik amacıyla takip etmesi kabul edilebilir.",
      lists: {
        lehine: ["Terör ve organize suçlarla daha kolay mücadele edilir.", "Toplumsal güvenlik sorunları öngörülerek çözülür.", "Siber dolandırıcılık vakaları durdurulur."],
        aleyhine: ["Temel insan haklarına ve mahremiyete aykırıdır.", "Siyasi muhaliflerin baskı altına alınma tehlikesi artar.", "Gücün kötüye kullanılmasına kapı aralanır."],
      },
    },
    {
      question: "Haftada sadece 4 gün çalışma sistemi tüm dünyada zorunlu olmalıdır.",
      lists: {
        lehine: ["İnsanların psikolojik ve fiziksel sağlıkları iyileşir.", "Aileye ayrılan vakit arttığı için mutlu toplum oluşur.", "Enerji tüketimi azalır."],
        aleyhine: ["Bazı sektörlerde ekonomik kriz riski yaratır.", "İş yükünün 4 güne sıkıştırılması stresi artırabilir.", "Maaşlarda düşüşler yaşanabileceği için gelir eşitsizliği artar."],
      },
    },
    {
      question: "GDO'lu (Genetiği Değiştirilmiş) ürünlerin tarımda kullanımı küresel gıda krizinin tek çözümüdür.",
      lists: {
        lehine: ["Kısıtlı topraklarda devasa hasatlar alınmasını sağlar.", "Açlık ile mücadelede en hızlı ve etkili yoldur.", "Zararlı kimyasal kullanımını azaltabilir."],
        aleyhine: ["İnsan vücudunda henüz bilinmeyen yan etkilere sebep olabilir.", "Yerel tohumları yok ederek bitki çeşitliliğini öldürür.", "Tarımsal tekelleşmeyi artırarak küçük çiftçiyi şirketlere muhtaç eder."],
      },
    },
    {
      question: "Yapay zeka sistemleri bilinç kazandığında onlara yasal haklar verilmelidir.",
      lists: {
        lehine: ["Bilinçli varlıkların sömürülmesi ahlaki değildir.", "Yasal çerçeve, kontrol dışı yapay zeka riskini azaltır.", "İnsanlığın geleceğine karşı sorumlu bir tutum olacaktır."],
        aleyhine: ["Algoritmalar gerçek duygu sahibi olamaz.", "Yapay zekaya hak vermek insan değerini zedeleyebilir.", "Bu hakların neye göre verileceği belirlenemez."],
      },
    },
  ],
};

// ====================================================
// 50 VARYANT üretici — tüm kombinasyonları deterministik hesapla
// ====================================================
export const generateAllVariants = () => {
  const { part1, part1_2, part2, part3 } = examBank;

  // Kartezyen çarpım yerine sabit sıralamayla rotasyon uygulayarak
  // 50 farklı varyant oluşturuyoruz.
  const variants = [];
  const p1Len = part1.length;       // 13
  const p12Len = part1_2.length;    // 3
  const p2Len = part2.length;       // 8
  const p3Len = part3.length;       // 8

  for (let i = 0; i < 50; i++) {
    // part1'den 3 soru — döngüsel kaydırma ile özgün kombinasyonlar
    const q1 = part1[(i * 3) % p1Len];
    const q2 = part1[(i * 3 + 1) % p1Len];
    const q3 = part1[(i * 3 + 2) % p1Len];

    const scenario1_2 = part1_2[i % p12Len];
    const scenario2   = part2[i % p2Len];
    const scenario3   = part3[i % p3Len];

    variants.push({
      variantNo: i + 1,
      part1Questions: [q1, q2, q3],
      part1_2Scenario: scenario1_2,
      part2Scenario: scenario2,
      part3Question: scenario3,
    });
  }
  return variants;
};

// ====================================================
// Tek sınav yükleyici (varyant numarasına göre)
// ====================================================
export const generateExam = (variant = 'random') => {
  const finalQuestions = [];
  let globalId = 1;

  let p1Questions, p12Scenario, p2Scenario, p3Question;

  if (variant === 'random') {
    // Rastgele parçaları karıştırmak yerine rastgele hazır bir varyanta (1-50) yönlendiriyoruz.
    variant = Math.floor(Math.random() * 50) + 1;
  }

  // Artık sadece deterministik (sabit) senaryo hesaplaması yapılıyor
  const idx = (parseInt(variant, 10) - 1) || 0;
  const { part1, part1_2, part2, part3 } = examBank;
  const p1Len = part1.length;
  const p12Len = part1_2.length;
  const p2Len = part2.length;
  const p3Len = part3.length;

  p1Questions  = [part1[(idx * 3) % p1Len], part1[(idx * 3 + 1) % p1Len], part1[(idx * 3 + 2) % p1Len]];
  p12Scenario  = part1_2[idx % p12Len];
  p2Scenario   = part2[idx % p2Len];
  p3Question   = part3[idx % p3Len];

  // --- 1. BÖLÜM ---
  finalQuestions.push({ type: 'transition', id: globalId++, title: '1. Bölüm' });
  p1Questions.forEach((q, idx) => {
    finalQuestions.push({
      type: 'question', id: globalId++, section: `1. Bölüm ${idx + 1}. Soru`,
      question: q.question, prepTime: 5, speakTime: 30, hasAudioBtn: true,
    });
  });

  // --- 1.2. BÖLÜM ---
  finalQuestions.push({ type: 'transition', id: globalId++, title: '1.2. Bölüm' });
  p12Scenario.questions.forEach((qData, idx) => {
    finalQuestions.push({
      type: 'question', id: globalId++, section: `1.2. Bölüm ${idx + 4}. Soru`,
      question: qData.q, image_url: idx === 0 ? p12Scenario.image_url : null,
      prepTime: 10, speakTime: 45, hasAudioBtn: true,
    });
  });

  // --- 2. BÖLÜM ---
  finalQuestions.push({ type: 'transition', id: globalId++, title: '2. Bölüm' });
  finalQuestions.push({
    type: 'question', id: globalId++, section: '2. Bölüm',
    image_url: p2Scenario.image_url, bullets: p2Scenario.bullets,
    prepTime: 60, speakTime: 120, hasAudioBtn: false,
  });

  // --- 3. BÖLÜM ---
  finalQuestions.push({ type: 'transition', id: globalId++, title: '3. Bölüm' });
  finalQuestions.push({
    type: 'question', id: globalId++, section: '3. Bölüm',
    question: p3Question.question, lists: p3Question.lists,
    prepTime: 60, speakTime: 120, hasAudioBtn: false,
  });

  return finalQuestions;
};
