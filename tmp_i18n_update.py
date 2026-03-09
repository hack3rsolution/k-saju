#!/usr/bin/env python3
"""Add new i18n keys to locale files for K-Saju."""
import json, os

LOCALES_DIR = "/Users/brucelee/Projects/k-saju/apps/mobile/src/i18n/locales"

# ── fortune.json additions ────────────────────────────────────────────────────

FORTUNE_ADDITIONS = {
    "ko": {
        "journal": {
            "emptyDesc": "커리어 변화, 인간관계, 건강 등 인생의 주요 순간을 기록하고 사주 패턴과의 연결을 찾아보세요.",
            "loading": "인생 일지 로딩 중…",
            "lockedAnalysis": "🔒 AI 패턴 분석을 열려면 이벤트 {{count}}개를 더 추가하세요"
        },
        "feedback": {
            "reasons": {
                "accurate": "정확해요",
                "want_more_depth": "더 깊이 알고 싶어요",
                "new_perspective": "새로운 시각이에요",
                "too_generic": "너무 일반적이에요",
                "factually_wrong": "사실과 달라요",
                "hard_to_understand": "이해하기 어려워요",
                "customInput": "직접 입력",
                "send": "전송",
                "customPlaceholder": "의견을 입력해주세요"
            }
        },
        "compatibility": {
            "partnerHint": "파트너의 생년월일을 입력하면 오행 궁합 점수를 확인할 수 있습니다.",
            "genderLabel": "파트너 성별",
            "seeWhy": "이유 보기 — 전체 리포트 잠금 해제 $4.99",
            "fullReportDesc": "오행 조화, 강점, 긴장 관계, 관계 예측 등 5개 섹션으로 구성된 심층 분석 리포트입니다."
        }
    },
    "en": {
        "journal": {
            "title": "Life Journal",
            "subtitle": "Life Events · 命運流",
            "addEvent": "Add Life Event",
            "recordPlaceholder": "Record key moments in your life",
            "noEvents": "No events recorded yet",
            "saveEvent": "Save",
            "savedToast": "Event saved",
            "aiAnalysis": "AI Pattern Analysis",
            "aiAnalysisDesc": "Discover how your saju cycles influenced life events",
            "emptyDesc": "Record key life moments — career changes, relationships, health — and discover patterns in your cosmic chart.",
            "loading": "Loading journal…",
            "lockedAnalysis": "🔒 Add {{count}} more event(s) to unlock AI pattern analysis"
        },
        "feedback": {
            "reasons": {
                "accurate": "Accurate",
                "want_more_depth": "Want more depth",
                "new_perspective": "Fresh perspective",
                "too_generic": "Too generic",
                "factually_wrong": "Factually wrong",
                "hard_to_understand": "Hard to understand",
                "customInput": "Write your own",
                "send": "Send",
                "customPlaceholder": "Share your thoughts…"
            }
        },
        "compatibility": {
            "title": "Compatibility",
            "subtitle": "Compatibility · 合婚 · Elemental Harmony",
            "partnerBirthDate": "Partner's Birth Date",
            "checkBtn": "Check Compatibility",
            "generateReport": "Generate Full Report",
            "analyzeAnother": "Analyze Another Person",
            "fullReport": "Full AI Report",
            "partnerHint": "Enter your partner's birth date to see your elemental compatibility score.",
            "genderLabel": "Partner's Gender",
            "seeWhy": "See why — Unlock full report $4.99",
            "fullReportDesc": "5-section deep-dive: elemental harmony, strengths, tensions, and relationship forecast."
        }
    },
    "zh-Hans": {
        "journal": {
            "title": "人生日记",
            "subtitle": "人生事件 · 命運流",
            "addEvent": "添加人生事件",
            "recordPlaceholder": "记录人生中的重要时刻",
            "noEvents": "还没有记录的事件",
            "saveEvent": "保存",
            "savedToast": "事件已保存",
            "aiAnalysis": "AI模式分析",
            "aiAnalysisDesc": "了解您的四柱周期如何影响人生事件",
            "emptyDesc": "记录职业变化、人际关系、健康等人生重要时刻，探索与四柱命理的关联。",
            "loading": "加载生命日志中…",
            "lockedAnalysis": "🔒 再添加 {{count}} 个事件即可解锁AI模式分析"
        },
        "feedback": {
            "reasons": {
                "accurate": "准确",
                "want_more_depth": "想要更深入",
                "new_perspective": "全新视角",
                "too_generic": "太笼统",
                "factually_wrong": "事实有误",
                "hard_to_understand": "难以理解",
                "customInput": "自定义输入",
                "send": "发送",
                "customPlaceholder": "分享您的想法…"
            }
        },
        "compatibility": {
            "title": "合婚",
            "subtitle": "合婚 · 五行相性",
            "partnerBirthDate": "对方生日",
            "checkBtn": "查看相性",
            "generateReport": "生成完整报告",
            "analyzeAnother": "分析其他人",
            "fullReport": "完整AI报告",
            "partnerHint": "输入对方的生日以查看五行相性分数。",
            "genderLabel": "对方性别",
            "seeWhy": "查看原因 — 解锁完整报告 $4.99",
            "fullReportDesc": "5部分深度分析：五行和谐、优势、紧张关系及关系预测。"
        }
    },
    "zh-Hant": {
        "journal": {
            "title": "人生日記",
            "subtitle": "人生事件 · 命運流",
            "addEvent": "新增人生事件",
            "recordPlaceholder": "記錄人生中的重要時刻",
            "noEvents": "還沒有記錄的事件",
            "saveEvent": "儲存",
            "savedToast": "事件已儲存",
            "aiAnalysis": "AI模式分析",
            "aiAnalysisDesc": "了解您的四柱周期如何影響人生事件",
            "emptyDesc": "記錄職業變化、人際關係、健康等人生重要時刻，探索與四柱命理的關聯。",
            "loading": "載入生命日誌中…",
            "lockedAnalysis": "🔒 再添加 {{count}} 個事件即可解鎖AI模式分析"
        },
        "feedback": {
            "reasons": {
                "accurate": "準確",
                "want_more_depth": "想要更深入",
                "new_perspective": "全新視角",
                "too_generic": "太籠統",
                "factually_wrong": "事實有誤",
                "hard_to_understand": "難以理解",
                "customInput": "自訂輸入",
                "send": "傳送",
                "customPlaceholder": "分享您的想法…"
            }
        },
        "compatibility": {
            "title": "合婚",
            "subtitle": "合婚 · 五行相性",
            "partnerBirthDate": "對方生日",
            "checkBtn": "查看相性",
            "generateReport": "生成完整報告",
            "analyzeAnother": "分析其他人",
            "fullReport": "完整AI報告",
            "partnerHint": "輸入對方的生日以查看五行相性分數。",
            "genderLabel": "對方性別",
            "seeWhy": "查看原因 — 解鎖完整報告 $4.99",
            "fullReportDesc": "5部分深度分析：五行和諧、優勢、緊張關係及關係預測。"
        }
    },
    "ja": {
        "journal": {
            "title": "人生日誌",
            "subtitle": "人生イベント · 命運流",
            "addEvent": "人生イベントを追加",
            "recordPlaceholder": "人生の重要な瞬間を記録しましょう",
            "noEvents": "まだ記録されたイベントがありません",
            "saveEvent": "保存",
            "savedToast": "イベントが保存されました",
            "aiAnalysis": "AIパターン分析",
            "aiAnalysisDesc": "四柱推命のサイクルが人生イベントにどう影響したかを探りましょう",
            "emptyDesc": "キャリアの変化、人間関係、健康など人生の重要な瞬間を記録し、四柱推命のパターンとの繋がりを見つけましょう。",
            "loading": "ライフジャーナルを読み込み中…",
            "lockedAnalysis": "🔒 AIパターン分析を解除するには{{count}}件のイベントを追加してください"
        },
        "feedback": {
            "reasons": {
                "accurate": "正確です",
                "want_more_depth": "もっと深く知りたい",
                "new_perspective": "新しい視点です",
                "too_generic": "一般的すぎます",
                "factually_wrong": "事実と違います",
                "hard_to_understand": "理解しにくいです",
                "customInput": "自分で入力",
                "send": "送信",
                "customPlaceholder": "ご意見をお聞かせください"
            }
        },
        "compatibility": {
            "title": "相性",
            "subtitle": "相性 · 合婚 · 五行ハーモニー",
            "partnerBirthDate": "相手の生年月日",
            "checkBtn": "相性を確認",
            "generateReport": "完全レポートを生成",
            "analyzeAnother": "別の人を分析する",
            "fullReport": "完全AIレポート",
            "partnerHint": "相手の生年月日を入力して五行相性スコアを確認しましょう。",
            "genderLabel": "相手の性別",
            "seeWhy": "理由を見る — 完全レポートを解除 $4.99",
            "fullReportDesc": "五行の調和、強み、緊張関係、関係予測の5セクション深層分析レポート。"
        }
    },
    "es": {
        "journal": {
            "title": "Diario de Vida",
            "subtitle": "Eventos de Vida · 命運流",
            "addEvent": "Agregar Evento de Vida",
            "recordPlaceholder": "Registra los momentos clave de tu vida",
            "noEvents": "No hay eventos registrados aún",
            "saveEvent": "Guardar",
            "savedToast": "Evento guardado",
            "aiAnalysis": "Análisis de Patrones IA",
            "aiAnalysisDesc": "Descubre cómo tus ciclos de saju influenciaron los eventos de tu vida",
            "emptyDesc": "Registra momentos clave — cambios de carrera, relaciones, salud — y descubre patrones en tu carta cósmica.",
            "loading": "Cargando diario…",
            "lockedAnalysis": "🔒 Agrega {{count}} evento(s) más para desbloquear el análisis de patrones IA"
        },
        "feedback": {
            "reasons": {
                "accurate": "Preciso",
                "want_more_depth": "Quiero más profundidad",
                "new_perspective": "Nueva perspectiva",
                "too_generic": "Demasiado genérico",
                "factually_wrong": "Incorrecto",
                "hard_to_understand": "Difícil de entender",
                "customInput": "Escribir propio",
                "send": "Enviar",
                "customPlaceholder": "Comparte tu opinión…"
            }
        },
        "compatibility": {
            "title": "Compatibilidad",
            "subtitle": "Compatibilidad · 合婚 · Armonía Elemental",
            "partnerBirthDate": "Fecha de Nacimiento del Compañero",
            "checkBtn": "Ver Compatibilidad",
            "generateReport": "Generar Reporte Completo",
            "analyzeAnother": "Analizar Otra Persona",
            "fullReport": "Reporte Completo IA",
            "partnerHint": "Ingresa la fecha de nacimiento de tu pareja para ver tu puntuación de compatibilidad elemental.",
            "genderLabel": "Género del Compañero",
            "seeWhy": "Ver por qué — Desbloquear reporte completo $4.99",
            "fullReportDesc": "Análisis profundo de 5 secciones: armonía elemental, fortalezas, tensiones y pronóstico de relación."
        }
    },
    "fr": {
        "journal": {
            "title": "Journal de Vie",
            "subtitle": "Événements de Vie · 命運流",
            "addEvent": "Ajouter un Événement de Vie",
            "recordPlaceholder": "Enregistrez les moments clés de votre vie",
            "noEvents": "Aucun événement enregistré",
            "saveEvent": "Enregistrer",
            "savedToast": "Événement enregistré",
            "aiAnalysis": "Analyse de Motifs IA",
            "aiAnalysisDesc": "Découvrez comment vos cycles de saju ont influencé vos événements de vie",
            "emptyDesc": "Enregistrez les moments clés — changements de carrière, relations, santé — et découvrez des liens avec votre carte cosmique.",
            "loading": "Chargement du journal…",
            "lockedAnalysis": "🔒 Ajoutez {{count}} événement(s) de plus pour débloquer l'analyse de motifs IA"
        },
        "feedback": {
            "reasons": {
                "accurate": "Précis",
                "want_more_depth": "Je veux plus de profondeur",
                "new_perspective": "Nouvelle perspective",
                "too_generic": "Trop générique",
                "factually_wrong": "Factuellement incorrect",
                "hard_to_understand": "Difficile à comprendre",
                "customInput": "Écrire le mien",
                "send": "Envoyer",
                "customPlaceholder": "Partagez vos pensées…"
            }
        },
        "compatibility": {
            "title": "Compatibilité",
            "subtitle": "Compatibilité · 合婚 · Harmonie Élémentale",
            "partnerBirthDate": "Date de Naissance du Partenaire",
            "checkBtn": "Vérifier la Compatibilité",
            "generateReport": "Générer le Rapport Complet",
            "analyzeAnother": "Analyser une Autre Personne",
            "fullReport": "Rapport IA Complet",
            "partnerHint": "Entrez la date de naissance de votre partenaire pour voir votre score de compatibilité élémentale.",
            "genderLabel": "Genre du Partenaire",
            "seeWhy": "Voir pourquoi — Débloquer le rapport complet $4.99",
            "fullReportDesc": "Analyse approfondie en 5 sections : harmonie élémentale, forces, tensions et prévision de relation."
        }
    },
    "de": {
        "journal": {
            "title": "Lebenstagebuch",
            "subtitle": "Lebensereignisse · 命運流",
            "addEvent": "Lebensereignis hinzufügen",
            "recordPlaceholder": "Wichtige Lebensmomente aufzeichnen",
            "noEvents": "Noch keine Ereignisse aufgezeichnet",
            "saveEvent": "Speichern",
            "savedToast": "Ereignis gespeichert",
            "aiAnalysis": "KI-Musteranalyse",
            "aiAnalysisDesc": "Entdecke, wie deine Saju-Zyklen die Lebensereignisse beeinflusst haben",
            "emptyDesc": "Zeichne wichtige Lebensmomente auf — Karriereveränderungen, Beziehungen, Gesundheit — und entdecke Muster in deinem kosmischen Diagramm.",
            "loading": "Tagebuch wird geladen…",
            "lockedAnalysis": "🔒 Füge {{count}} weiteres Ereignis hinzu, um die KI-Musteranalyse freizuschalten"
        },
        "feedback": {
            "reasons": {
                "accurate": "Zutreffend",
                "want_more_depth": "Mehr Tiefe gewünscht",
                "new_perspective": "Neue Perspektive",
                "too_generic": "Zu allgemein",
                "factually_wrong": "Sachlich falsch",
                "hard_to_understand": "Schwer verständlich",
                "customInput": "Eigenes eingeben",
                "send": "Senden",
                "customPlaceholder": "Teile deine Gedanken…"
            }
        },
        "compatibility": {
            "title": "Kompatibilität",
            "subtitle": "Kompatibilität · 合婚 · Elementare Harmonie",
            "partnerBirthDate": "Geburtsdatum des Partners",
            "checkBtn": "Kompatibilität prüfen",
            "generateReport": "Vollständigen Bericht erstellen",
            "analyzeAnother": "Andere Person analysieren",
            "fullReport": "Vollständiger KI-Bericht",
            "partnerHint": "Gib das Geburtsdatum deines Partners ein, um deinen elementaren Kompatibilitätsscore zu sehen.",
            "genderLabel": "Geschlecht des Partners",
            "seeWhy": "Warum sehen — Vollständigen Bericht freischalten $4.99",
            "fullReportDesc": "5-Abschnitt-Tiefenanalyse: elementare Harmonie, Stärken, Spannungen und Beziehungsprognose."
        }
    },
    "pt-BR": {
        "journal": {
            "title": "Diário de Vida",
            "subtitle": "Eventos de Vida · 命運流",
            "addEvent": "Adicionar Evento de Vida",
            "recordPlaceholder": "Registre momentos importantes da sua vida",
            "noEvents": "Nenhum evento registrado ainda",
            "saveEvent": "Salvar",
            "savedToast": "Evento salvo",
            "aiAnalysis": "Análise de Padrões IA",
            "aiAnalysisDesc": "Descubra como seus ciclos de saju influenciaram os eventos da sua vida",
            "emptyDesc": "Registre momentos importantes da vida — mudanças de carreira, relacionamentos, saúde — e descubra padrões no seu mapa cósmico.",
            "loading": "Carregando diário…",
            "lockedAnalysis": "🔒 Adicione mais {{count}} evento(s) para desbloquear a análise de padrões IA"
        },
        "feedback": {
            "reasons": {
                "accurate": "Preciso",
                "want_more_depth": "Quero mais profundidade",
                "new_perspective": "Nova perspectiva",
                "too_generic": "Muito genérico",
                "factually_wrong": "Factualmente errado",
                "hard_to_understand": "Difícil de entender",
                "customInput": "Escrever próprio",
                "send": "Enviar",
                "customPlaceholder": "Compartilhe seus pensamentos…"
            }
        },
        "compatibility": {
            "title": "Compatibilidade",
            "subtitle": "Compatibilidade · 合婚 · Harmonia Elemental",
            "partnerBirthDate": "Data de Nascimento do Parceiro",
            "checkBtn": "Ver Compatibilidade",
            "generateReport": "Gerar Relatório Completo",
            "analyzeAnother": "Analisar Outra Pessoa",
            "fullReport": "Relatório Completo IA",
            "partnerHint": "Insira a data de nascimento do seu parceiro para ver sua pontuação de compatibilidade elemental.",
            "genderLabel": "Gênero do Parceiro",
            "seeWhy": "Ver por quê — Desbloquear relatório completo $4.99",
            "fullReportDesc": "Análise profunda em 5 seções: harmonia elemental, pontos fortes, tensões e previsão de relacionamento."
        }
    },
    "hi": {
        "journal": {
            "title": "जीवन डायरी",
            "subtitle": "जीवन घटनाएँ · 命運流",
            "addEvent": "जीवन घटना जोड़ें",
            "recordPlaceholder": "जीवन के महत्वपूर्ण क्षण रिकॉर्ड करें",
            "noEvents": "अभी तक कोई घटना दर्ज नहीं है",
            "saveEvent": "सहेजें",
            "savedToast": "घटना सहेजी गई",
            "aiAnalysis": "AI पैटर्न विश्लेषण",
            "aiAnalysisDesc": "जानें कि आपके सजू चक्रों ने जीवन की घटनाओं को कैसे प्रभावित किया",
            "emptyDesc": "जीवन के प्रमुख क्षण रिकॉर्ड करें — करियर बदलाव, रिश्ते, स्वास्थ्य — और अपने ब्रह्मांडीय चार्ट में पैटर्न खोजें।",
            "loading": "डायरी लोड हो रही है…",
            "lockedAnalysis": "🔒 AI पैटर्न विश्लेषण अनलॉक करने के लिए {{count}} और इवेंट जोड़ें"
        },
        "feedback": {
            "reasons": {
                "accurate": "सटीक",
                "want_more_depth": "अधिक गहराई चाहिए",
                "new_perspective": "नया दृष्टिकोण",
                "too_generic": "बहुत सामान्य",
                "factually_wrong": "तथ्यात्मक रूप से गलत",
                "hard_to_understand": "समझना मुश्किल",
                "customInput": "खुद लिखें",
                "send": "भेजें",
                "customPlaceholder": "अपने विचार साझा करें…"
            }
        },
        "compatibility": {
            "title": "अनुकूलता",
            "subtitle": "अनुकूलता · 合婚 · तत्व सामंजस्य",
            "partnerBirthDate": "साथी की जन्म तिथि",
            "checkBtn": "अनुकूलता जाँचें",
            "generateReport": "पूरी रिपोर्ट बनाएं",
            "analyzeAnother": "किसी और का विश्लेषण करें",
            "fullReport": "पूर्ण AI रिपोर्ट",
            "partnerHint": "अपने साथी की जन्म तिथि दर्ज करें और तत्व अनुकूलता स्कोर देखें।",
            "genderLabel": "साथी का लिंग",
            "seeWhy": "कारण देखें — पूरी रिपोर्ट अनलॉक करें $4.99",
            "fullReportDesc": "5 खंडों में गहन विश्लेषण: तत्व सामंजस्य, ताकत, तनाव और संबंध पूर्वानुमान।"
        }
    },
    "vi": {
        "journal": {
            "title": "Nhật Ký Cuộc Đời",
            "subtitle": "Sự Kiện Cuộc Đời · 命運流",
            "addEvent": "Thêm Sự Kiện",
            "recordPlaceholder": "Ghi lại những khoảnh khắc quan trọng",
            "noEvents": "Chưa có sự kiện nào được ghi lại",
            "saveEvent": "Lưu",
            "savedToast": "Sự kiện đã được lưu",
            "aiAnalysis": "Phân Tích Mẫu AI",
            "aiAnalysisDesc": "Khám phá cách các chu kỳ saju của bạn ảnh hưởng đến các sự kiện cuộc đời",
            "emptyDesc": "Ghi lại những khoảnh khắc quan trọng — thay đổi sự nghiệp, các mối quan hệ, sức khỏe — và khám phá các quy luật trong biểu đồ vũ trụ của bạn.",
            "loading": "Đang tải nhật ký…",
            "lockedAnalysis": "🔒 Thêm {{count}} sự kiện nữa để mở khóa phân tích mẫu AI"
        },
        "feedback": {
            "reasons": {
                "accurate": "Chính xác",
                "want_more_depth": "Muốn sâu hơn",
                "new_perspective": "Góc nhìn mới",
                "too_generic": "Quá chung chung",
                "factually_wrong": "Sai thực tế",
                "hard_to_understand": "Khó hiểu",
                "customInput": "Tự nhập",
                "send": "Gửi",
                "customPlaceholder": "Chia sẻ suy nghĩ của bạn…"
            }
        },
        "compatibility": {
            "title": "Tương Hợp",
            "subtitle": "Tương Hợp · 合婚 · Ngũ Hành Hòa Hợp",
            "partnerBirthDate": "Ngày Sinh Của Đối Tác",
            "checkBtn": "Kiểm Tra Tương Hợp",
            "generateReport": "Tạo Báo Cáo Đầy Đủ",
            "analyzeAnother": "Phân Tích Người Khác",
            "fullReport": "Báo Cáo AI Đầy Đủ",
            "partnerHint": "Nhập ngày sinh của đối tác để xem điểm tương hợp ngũ hành.",
            "genderLabel": "Giới Tính Đối Tác",
            "seeWhy": "Xem lý do — Mở khóa báo cáo đầy đủ $4.99",
            "fullReportDesc": "Phân tích sâu 5 phần: hòa hợp ngũ hành, điểm mạnh, căng thẳng và dự báo quan hệ."
        }
    },
    "id": {
        "journal": {
            "title": "Jurnal Kehidupan",
            "subtitle": "Peristiwa Hidup · 命運流",
            "addEvent": "Tambah Peristiwa",
            "recordPlaceholder": "Catat momen penting dalam hidupmu",
            "noEvents": "Belum ada peristiwa yang dicatat",
            "saveEvent": "Simpan",
            "savedToast": "Peristiwa tersimpan",
            "aiAnalysis": "Analisis Pola AI",
            "aiAnalysisDesc": "Temukan bagaimana siklus saju kamu memengaruhi peristiwa hidupmu",
            "emptyDesc": "Catat momen penting dalam hidup — perubahan karir, hubungan, kesehatan — dan temukan pola dalam chart kosmik kamu.",
            "loading": "Memuat jurnal…",
            "lockedAnalysis": "🔒 Tambah {{count}} event lagi untuk membuka analisis pola AI"
        },
        "feedback": {
            "reasons": {
                "accurate": "Akurat",
                "want_more_depth": "Ingin lebih dalam",
                "new_perspective": "Perspektif baru",
                "too_generic": "Terlalu umum",
                "factually_wrong": "Salah fakta",
                "hard_to_understand": "Sulit dipahami",
                "customInput": "Tulis sendiri",
                "send": "Kirim",
                "customPlaceholder": "Bagikan pendapatmu…"
            }
        },
        "compatibility": {
            "title": "Kecocokan",
            "subtitle": "Kecocokan · 合婚 · Harmoni Elemen",
            "partnerBirthDate": "Tanggal Lahir Pasangan",
            "checkBtn": "Cek Kecocokan",
            "generateReport": "Buat Laporan Lengkap",
            "analyzeAnother": "Analisis Orang Lain",
            "fullReport": "Laporan AI Lengkap",
            "partnerHint": "Masukkan tanggal lahir pasanganmu untuk melihat skor kecocokan elemen.",
            "genderLabel": "Jenis Kelamin Pasangan",
            "seeWhy": "Lihat alasannya — Buka laporan lengkap $4.99",
            "fullReportDesc": "Analisis mendalam 5 bagian: harmoni elemen, kekuatan, ketegangan, dan prakiraan hubungan."
        }
    },
    "th": {
        "journal": {
            "title": "บันทึกชีวิต",
            "subtitle": "เหตุการณ์ในชีวิต · 命運流",
            "addEvent": "เพิ่มเหตุการณ์",
            "recordPlaceholder": "บันทึกช่วงเวลาสำคัญในชีวิต",
            "noEvents": "ยังไม่มีเหตุการณ์ที่บันทึกไว้",
            "saveEvent": "บันทึก",
            "savedToast": "บันทึกเหตุการณ์แล้ว",
            "aiAnalysis": "การวิเคราะห์รูปแบบ AI",
            "aiAnalysisDesc": "ค้นพบว่าวัฏจักรซาจูของคุณส่งผลต่อเหตุการณ์ในชีวิตอย่างไร",
            "emptyDesc": "บันทึกช่วงเวลาสำคัญในชีวิต — การเปลี่ยนแปลงอาชีพ, ความสัมพันธ์, สุขภาพ — และค้นพบรูปแบบในดวงชะตาของคุณ",
            "loading": "กำลังโหลดบันทึก…",
            "lockedAnalysis": "🔒 เพิ่มอีก {{count}} เหตุการณ์เพื่อปลดล็อกการวิเคราะห์รูปแบบ AI"
        },
        "feedback": {
            "reasons": {
                "accurate": "แม่นยำ",
                "want_more_depth": "ต้องการความลึกมากขึ้น",
                "new_perspective": "มุมมองใหม่",
                "too_generic": "ทั่วไปเกินไป",
                "factually_wrong": "ข้อเท็จจริงผิด",
                "hard_to_understand": "เข้าใจยาก",
                "customInput": "เขียนเอง",
                "send": "ส่ง",
                "customPlaceholder": "แบ่งปันความคิดของคุณ…"
            }
        },
        "compatibility": {
            "title": "ความเข้ากัน",
            "subtitle": "ความเข้ากัน · 合婚 · ความสมดุลธาตุ",
            "partnerBirthDate": "วันเกิดของคู่ครอง",
            "checkBtn": "ตรวจสอบความเข้ากัน",
            "generateReport": "สร้างรายงานฉบับสมบูรณ์",
            "analyzeAnother": "วิเคราะห์คนอื่น",
            "fullReport": "รายงาน AI ฉบับสมบูรณ์",
            "partnerHint": "ป้อนวันเกิดของคู่ครองเพื่อดูคะแนนความเข้ากันด้านธาตุ",
            "genderLabel": "เพศของคู่ครอง",
            "seeWhy": "ดูเหตุผล — ปลดล็อกรายงานฉบับสมบูรณ์ $4.99",
            "fullReportDesc": "การวิเคราะห์เชิงลึก 5 ส่วน: ความสมดุลธาตุ, จุดแข็ง, ความตึงเครียด และการพยากรณ์ความสัมพันธ์"
        }
    },
    "ar": {
        "journal": {
            "title": "يوميات الحياة",
            "subtitle": "أحداث الحياة · 命運流",
            "addEvent": "إضافة حدث",
            "recordPlaceholder": "سجّل اللحظات المهمة في حياتك",
            "noEvents": "لا أحداث مسجلة بعد",
            "saveEvent": "حفظ",
            "savedToast": "تم حفظ الحدث",
            "aiAnalysis": "تحليل أنماط الذكاء الاصطناعي",
            "aiAnalysisDesc": "اكتشف كيف أثّرت دورات ساجو على أحداث حياتك",
            "emptyDesc": "سجّل لحظات حياتك الكبرى — التغييرات المهنية والعلاقات والصحة — واكتشف الأنماط في خريطتك الكونية.",
            "loading": "جارٍ تحميل اليوميات…",
            "lockedAnalysis": "🔒 أضف {{count}} حدث آخر لفتح تحليل أنماط الذكاء الاصطناعي"
        },
        "feedback": {
            "reasons": {
                "accurate": "دقيق",
                "want_more_depth": "أريد مزيداً من العمق",
                "new_perspective": "منظور جديد",
                "too_generic": "عام جداً",
                "factually_wrong": "خاطئ واقعياً",
                "hard_to_understand": "صعب الفهم",
                "customInput": "اكتب رأيك",
                "send": "إرسال",
                "customPlaceholder": "شارك أفكارك…"
            }
        },
        "compatibility": {
            "title": "التوافق",
            "subtitle": "التوافق · 合婚 · الانسجام العنصري",
            "partnerBirthDate": "تاريخ ميلاد الشريك",
            "checkBtn": "التحقق من التوافق",
            "generateReport": "إنشاء تقرير كامل",
            "analyzeAnother": "تحليل شخص آخر",
            "fullReport": "تقرير ذكاء اصطناعي كامل",
            "partnerHint": "أدخل تاريخ ميلاد شريكك لرؤية درجة التوافق العنصري.",
            "genderLabel": "جنس الشريك",
            "seeWhy": "اعرف السبب — افتح التقرير الكامل $4.99",
            "fullReportDesc": "تحليل معمّق في 5 أقسام: الانسجام العنصري والنقاط القوية والتوترات وتوقعات العلاقة."
        }
    }
}


def deep_merge(base, additions):
    """Deep merge additions into base dict."""
    result = dict(base)
    for key, val in additions.items():
        if key in result and isinstance(result[key], dict) and isinstance(val, dict):
            result[key] = deep_merge(result[key], val)
        else:
            result[key] = val
    return result


def update_fortune_json(lang, additions):
    path = os.path.join(LOCALES_DIR, lang, "fortune.json")
    if not os.path.exists(path):
        print(f"MISSING: {path}")
        return
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    data = deep_merge(data, additions)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"Updated: {path}")


for lang, additions in FORTUNE_ADDITIONS.items():
    update_fortune_json(lang, additions)

print("Done with fortune.json updates")
