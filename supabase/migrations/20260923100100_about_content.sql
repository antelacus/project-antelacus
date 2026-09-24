-- The about page in five languages, moved out of the repository's MDX files into site_pages. A row that
-- already exists is kept: an edit made in the admin must never be overwritten by re-running this.
insert into public.site_pages (slug, locale, title, body_markdown, status) values
('about', 'zh-CN', '关于', $md$你好！我是 **AnteLacus**，一名曾经的审计师。迷上 AI 之后，我终于实现了长久以来的心愿——拥有一片自己的赛博天地。

我只**创作我喜欢的东西**。

## 格言

**Ante Lacus, Pax Mentis**——临湖之前，心境平和。

拉丁文的材料，中国的骨架：两两相对如一副对句，不用动词，只把一处景与一种心境并置。湖与心安是东西方共有的意象：心如止水；叶芝也说 *I shall have some peace there*。

## 这个网站

古典中国的内核，现代的形式。中国的部分放在结构里——留白、节奏、分寸——而不在表面的纹样上。你大概指不出它在哪里，这正是用意。

网站为不同的访客而做：键盘、读屏、触屏、放大，都能用到全部功能。界面有五种语言；每篇内容以写作时的语言呈现。

## 联系我

- 邮箱：[me@antelacus.com](mailto:me@antelacus.com)
- GitHub：[@antelacus](https://github.com/antelacus)
- X：[@ante_lacus](https://x.com/ante_lacus)
- Instagram：[@antelacus](https://instagram.com/antelacus)
$md$, 'published'),

('about', 'zh-HK', '關於', $md$你好！我是 **AnteLacus**，一名曾經的審計師。迷上 AI 之後，我終於實現了長久以來的心願——擁有一片自己的賽博天地。

我只**創作我喜歡的東西**。

## 格言

**Ante Lacus, Pax Mentis**——臨湖之前，心境平和。

拉丁文的材料，中國的骨架：兩兩相對如一副對句，不用動詞，只把一處景與一種心境並置。湖與心安是東西方共有的意象：心如止水；葉芝也說 *I shall have some peace there*。

## 這個網站

古典中國的內核，現代的形式。中國的部分放在結構裏——留白、節奏、分寸——而不在表面的紋樣上。你大概指不出它在哪裏，這正是用意。

網站為不同的訪客而做：鍵盤、讀屏、觸屏、放大，都能用到全部功能。界面有五種語言；每篇內容以寫作時的語言呈現。

## 聯繫我

- 郵箱：[me@antelacus.com](mailto:me@antelacus.com)
- GitHub：[@antelacus](https://github.com/antelacus)
- X：[@ante_lacus](https://x.com/ante_lacus)
- Instagram：[@antelacus](https://instagram.com/antelacus)
$md$, 'published'),

('about', 'en', 'About', $md$Hello! I'm **AnteLacus**, a former auditor. After falling for AI, I finally fulfilled a long-held wish: a corner of cyberspace of my own.

I only **make what I love**.

## The motto

**Ante Lacus, Pax Mentis** — before the lake, a mind at peace.

Latin material on a Chinese frame: two pairs set against each other like a couplet, no verb, only a scene placed beside a state of mind. The lake and the quiet mind belong to East and West alike: a heart like still water; Yeats's *I shall have some peace there*.

## This site

A classical Chinese core in a modern form. The Chinese part lives in the structure — white space, rhythm, proportion — not in ornament on the surface. You probably cannot point to where it is; that is the intent.

The site is built for different visitors: keyboard, screen reader, touch and zoom all reach every feature. The interface comes in five languages; each piece of writing appears in the language it was written in.

## Contact

- Email: [me@antelacus.com](mailto:me@antelacus.com)
- GitHub: [@antelacus](https://github.com/antelacus)
- X: [@ante_lacus](https://x.com/ante_lacus)
- Instagram: [@antelacus](https://instagram.com/antelacus)
$md$, 'published'),

('about', 'es', 'Acerca de', $md$¡Hola! Soy **AnteLacus**, un antiguo auditor. Después de enamorarme de la IA, por fin cumplí un deseo que tenía desde hace mucho: un rincón propio en el ciberespacio.

Solo **creo lo que amo**.

## El lema

**Ante Lacus, Pax Mentis**: ante el lago, la mente en paz.

Material latino sobre un armazón chino: dos pares enfrentados como un dístico, sin verbo, solo un paisaje junto a un estado de ánimo. El lago y la mente serena pertenecen a Oriente y a Occidente por igual: un corazón como agua quieta; el *I shall have some peace there* de Yeats.

## Este sitio

Un núcleo chino clásico en una forma moderna. Lo chino vive en la estructura —el espacio en blanco, el ritmo, la proporción—, no en el adorno de la superficie. Probablemente no puedas señalar dónde está; esa es la intención.

El sitio está hecho para visitantes distintos: con teclado, lector de pantalla, pantalla táctil o zoom se llega a todas sus funciones. La interfaz está en cinco idiomas; cada texto aparece en el idioma en que fue escrito.

## Contacto

- Correo: [me@antelacus.com](mailto:me@antelacus.com)
- GitHub: [@antelacus](https://github.com/antelacus)
- X: [@ante_lacus](https://x.com/ante_lacus)
- Instagram: [@antelacus](https://instagram.com/antelacus)
$md$, 'published'),

('about', 'fr', 'À propos', $md$Bonjour ! Je suis **AnteLacus**, un ancien auditeur. Après être tombé sous le charme de l'IA, j'ai enfin réalisé un vieux souhait : un coin du cyberespace à moi.

Je ne **crée que ce que j'aime**.

## La devise

**Ante Lacus, Pax Mentis** — devant le lac, l'esprit en paix.

Une matière latine sur une charpente chinoise : deux paires qui se répondent comme un distique, sans verbe, un paysage simplement posé à côté d'un état d'âme. Le lac et l'esprit apaisé appartiennent à l'Orient comme à l'Occident : un cœur comme une eau immobile ; le *I shall have some peace there* de Yeats.

## Ce site

Un cœur chinois classique dans une forme moderne. La part chinoise vit dans la structure — le blanc, le rythme, la proportion —, pas dans l'ornement de surface. Vous ne sauriez sans doute pas dire où elle se trouve ; c'est voulu.

Le site est fait pour des visiteurs différents : clavier, lecteur d'écran, écran tactile ou zoom donnent accès à toutes ses fonctions. L'interface existe en cinq langues ; chaque texte paraît dans la langue où il a été écrit.

## Contact

- E-mail : [me@antelacus.com](mailto:me@antelacus.com)
- GitHub : [@antelacus](https://github.com/antelacus)
- X : [@ante_lacus](https://x.com/ante_lacus)
- Instagram : [@antelacus](https://instagram.com/antelacus)
$md$, 'published')
on conflict (slug, locale) do nothing;
