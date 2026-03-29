import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_for_build_bypass');

export async function POST(request: Request) {
    try {
        const apiKey = process.env.RESEND_API_KEY || 're_dummy_key_for_build_bypass';
        const maskedApiKey = apiKey.length > 8 ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : apiKey;

        console.log(`[DEBUG] POST /api/contact. Used API Key: ${maskedApiKey} (length: ${apiKey.length})`);
        console.log(`[DEBUG] Is dummy key used?: ${apiKey === 're_dummy_key_for_build_bypass'}`);
        console.log(`[DEBUG] RESEND_API_KEY from env: ${process.env.RESEND_API_KEY ? 'Set' : 'Not set'}`);

        const { name, email, message, budget, timeline, hearingData } = await request.json();

        let hearingTextAdmin = '';
        let hearingTextCustomer = '';

        if (hearingData && hearingData.data) {
            const data = hearingData.data;
            const subData = hearingData.subData || {};
            const qMap: Record<string, string> = {
                'q1': 'ビジネスジャンル',
                'q2': 'Webサイトを作る目的',
                'q3': '主なターゲット',
                'q4': 'サイトに欲しい強み',
                'q5': 'サイトの雰囲気',
                'q6': 'ビジュアルのメイン',
                'q7': '参考サイトイメージ',
                'q8': 'ページ数のイメージ',
                'q9': 'コンテンツの更新頻度',
                'q10': '必要な機能',
                'q11': 'ドメイン・サーバーの準備',
                'q12': '制作予算のイメージ',
                'q13': '公開希望の時期',
                'q14': '素材の準備状況'
            };
            const formatAnswers = (ans: string[], qId: string) => {
                if (!ans || !ans.length) return '未回答';
                return ans.map(a => {
                    const subText = subData[qId] && subData[qId][a];
                    return `・${a}${subText ? ` (${subText})` : ''}`;
                }).join('<br>');
            };
            const hearingRows = Object.keys(qMap).map((qId, index) => {
                const ansStr = formatAnswers(data[qId], qId);
                return `<p style="margin-bottom:8px"><strong>Q${index + 1}. ${qMap[qId]}:</strong><br>${ansStr}</p>`;
            }).join('');

            hearingTextAdmin = `
        <br><hr>
        <h3>📊 添付されたヒアリングシートの内容</h3>
        ${hearingRows}
      `;
            hearingTextCustomer = `
        <br><hr>
        <h3>📊 以下のヒアリングシート内容も同時に受け付けました</h3>
        ${hearingRows}
      `;
        }

        if (!name || !email || !message) {
            return NextResponse.json(
                { error: '必要項目（お名前、メールアドレス、ご相談内容）が入力されていません。' },
                { status: 400 }
            );
        }

        const contactEmail = process.env.CONTACT_EMAIL || 'info@noe-shiftica.com';

        // 1. お客様への自動返信メール
        const { data: customerData, error: customerError } = await resend.emails.send({
            from: 'Noe Shiftica <info@noe-shiftica.com>',
            to: [email],
            subject: '【Noe Shiftica】お問い合わせを受け付けました',
            html: `
        <p>${name} 様</p>
        <p>お問い合わせありがとうございます。<br>以下の内容で承りました。現在処理中ですので、Noe Shifticaからのメールが近日中に届きます。今しばらくお待ちください。</p>
        <hr>
        <p><strong>ご相談内容:</strong><br>${message.replace(/\n/g, '<br>')}</p>
        <p><strong>ご予算感:</strong> ${budget || '未定'}</p>
        <p><strong>公開希望時期:</strong> ${timeline || '未定'}</p>
        <hr>
        ${hearingTextCustomer}
        <p>引き続きよろしくお願いいたします。</p>
        <p>Noe Shiftica</p>
      `,
        });

        if (customerError) {
            console.error('Resend Error (Customer Email):', customerError);
            return NextResponse.json({ error: '自動返信メールの送信に失敗しました。', details: customerError }, { status: 500 });
        }

        // 2. 管理者への通知メール
        const { data: adminData, error: adminError } = await resend.emails.send({
            from: 'Noe Shiftica <info@noe-shiftica.com>',
            to: [contactEmail],
            subject: `【新規お問い合わせ】${name} 様より`,
            html: `
        <p>新規のお問い合わせがありました。</p>
        <hr>
        <p><strong>お名前:</strong> ${name}</p>
        <p><strong>メールアドレス:</strong> ${email}</p>
        <p><strong>ご相談内容:</strong><br>${message.replace(/\n/g, '<br>')}</p>
        <p><strong>ご予算感:</strong> ${budget}</p>
        <p><strong>公開希望時期:</strong> ${timeline}</p>
        <hr>
        ${hearingTextAdmin}
      `,
        });

        if (adminError) {
            console.error('Resend Error (Admin Email):', adminError);
            return NextResponse.json({ error: '管理者宛の通知メールの送信に失敗しました。', details: adminError }, { status: 500 });
        }

        return NextResponse.json({ success: true, customerData, adminData });
    } catch (error) {
        console.error('Contact form error:', error);
        return NextResponse.json(
            { error: '送信中にエラーが発生しました。時間をおいて再度お試しください。' },
            { status: 500 }
        );
    }
}



