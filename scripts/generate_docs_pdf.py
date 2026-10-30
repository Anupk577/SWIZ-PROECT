#!/usr/bin/env python3
"""
Swiz Token Protocol - Plain-English Architecture & Workflow Manual Generator
Produces an intuitive, publication-grade, multi-page PDF document that anyone can easily understand.
"""

import sys
import os
import zlib
import time

class PDFDoc:
    def __init__(self, filename="Swiz_Token_Protocol_Specification.pdf"):
        self.filename = filename
        self.pages = []
        self.current_page_stream = []
        self.page_width = 595.28  # A4 standard points (8.27 in)
        self.page_height = 841.89 # A4 standard points (11.69 in)
        self.margin_x = 40.0
        self.margin_top = 44.0
        self.margin_bottom = 44.0
        self.content_width = self.page_width - 2 * self.margin_x
        self.cursor_y = self.page_height - self.margin_top
        self.total_pages = 0

    def start_page(self):
        self.current_page_stream = []
        self.cursor_y = self.page_height - self.margin_top

    def end_page(self):
        self.pages.append("".join(self.current_page_stream))
        self.current_page_stream = []

    def check_space(self, required_height):
        if self.cursor_y - required_height < self.margin_bottom:
            self.end_page()
            self.start_page()
            self.draw_header()

    def draw_header(self):
        s = f"""
q
0.93 0.94 0.96 rg
{self.margin_x} {self.page_height - 30} {self.content_width} 1 re f
0.55 0.1 0.1 rg
{self.margin_x} {self.page_height - 30} 45 1.5 re f
0.4 0.45 0.5 rg
BT
/F2 7.5 Tf
{self.margin_x} {self.page_height - 23} Td
(SWIZ TOKEN (SZ) PROTOCOL  |  PLAIN-ENGLISH ARCHITECTURE & WORKFLOW MANUAL) Tj
ET
BT
/F1 7.5 Tf
{self.page_width - self.margin_x - 90} {self.page_height - 23} Td
(COMMUNITY & INVESTOR EDITION) Tj
ET
Q
"""
        self.current_page_stream.append(s)

    def draw_footer(self, page_num, total_pages):
        s = f"""
q
0.88 0.88 0.9 RG
{self.margin_x} 32 m {self.page_width - self.margin_x} 32 l S
0.45 0.45 0.48 rg
BT
/F1 8 Tf
{self.margin_x} 20 Td
(Swiz Ecosystem - 20-Year Algorithmic Growth & Automated FIFO Buyback System) Tj
ET
BT
/F2 8 Tf
{self.page_width - self.margin_x - 55} 20 Td
(Page {page_num} of {total_pages}) Tj
ET
Q
"""
        return s

    def escape_text(self, text):
        return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")

    def add_cover(self):
        self.start_page()
        s = f"""
q
0.07 0.08 0.12 rg
0 {self.page_height - 230} {self.page_width} 230 re f
0.55 0.1 0.1 rg
0 {self.page_height - 235} {self.page_width} 5 re f

0.1 0.65 0.4 rg
{self.margin_x} {self.page_height - 48} 95 16 re f
1 1 1 rg
BT
/F2 8.5 Tf
{self.margin_x + 8} {self.page_height - 37} Td
(PLAIN-ENGLISH GUIDE) Tj
ET
BT
/F1 9 Tf
{self.margin_x + 105} {self.page_height - 37} Td
(EASY-TO-UNDERSTAND WORKFLOWS & REAL-WORLD EXAMPLES) Tj
ET

BT
/F2 24 Tf
{self.margin_x} {self.page_height - 90} Td
(SWIZ TOKEN (SZ) PROTOCOL) Tj
ET

BT
/F2 15 Tf
0.92 0.94 0.97 rg
{self.margin_x} {self.page_height - 116} Td
(Complete Step-by-Step Flow & Module Workflow Manual) Tj
ET

BT
/F1 10 Tf
0.75 0.78 0.85 rg
{self.margin_x} {self.page_height - 142} Td
(A clear, transparent breakdown of the 20-Year locked vault, algorithmic price growth,) Tj
ET
{self.margin_x} {self.page_height - 156} Td
(automatic FIFO buybacks, zero-claim payouts, and multi-asset distributions.) Tj
ET
Q
"""
        self.current_page_stream.append(s)
        self.cursor_y = self.page_height - 265

        self.add_callout(
            "THE 60-SECOND SUMMARY: HOW DOES IT WORK?",
            [
                "1. Safe 20-Year Vault: When you purchase Swiz (SZ), tokens are locked safely in the smart contract. There is no panic-selling or early market dumping. Every single year for 20 years, exactly 5% of your tokens unlock.",
                "2. Algorithmic Price Growth: Every time new packages are bought, the official price step increases automatically by +2.33%. Price growth is mathematically tied to protocol adoption, not speculative market swings.",
                "3. 100% Automated Buybacks (No Claiming!): Once a 5% tranche unlocks, it lines up in a fair First-In, First-Out (FIFO) queue. When new buyers purchase SZ, the contract automatically buys your unlocked tokens at the higher price and sends the money straight to your wallet. You pay zero gas and click zero claim buttons!",
                "4. Clear Payouts: Year 1 pays you 100% Cash/USDT directly. Years 2 to 20 pay you 100% Ecosystem Tokens (ET) to reward you with long-term platform value, while the USDT funds company growth."
            ],
            color_theme="crimson"
        )

        self.add_vspace(12)
        self.add_heading_2("AT-A-GLANCE SYSTEM PARAMETERS")
        meta = [
            ("What is SZ?", "Swiz Token - A 20-year fixed-supply progressive asset locked in smart contract custody."),
            ("How do I buy?", "Deposit USDT through the cross-chain bridge or purchase directly on Polygon Amoy."),
            ("How does price climb?", "Increases +2.33% compounded per 1,000 packages or $100k USD platform volume."),
            ("How much unlocks each year?", "Exactly 5.00% every 365 days across 20 annual tranches."),
            ("Do I have to click 'Claim'?", "NO. Payouts are 100% automated directly into your wallet when new purchases occur."),
            ("Year 1 Buyback Payout", "100% USDT cash sent directly to your wallet."),
            ("Years 2-20 Buyback Payout", "100% Ecosystem Tokens (ET) minted directly to your wallet; USDT to treasury."),
            ("Maximum Price Cap", "Up to 100x your original purchase price (protects protocol solvency)."),
            ("Lost Wallet Protection?", "Yes. Secondary Backup Wallet feature allows admin to recover your packages if hacked.")
        ]
        self.add_table(["Question / Feature", "How It Works in Plain English"], meta, col_widths=[150, 365])
        self.end_page()

    def add_heading_1(self, title):
        self.check_space(42)
        clean = self.escape_text(title)
        s = f"""
q
0.55 0.1 0.1 rg
{self.margin_x} {self.cursor_y - 3} 4 15 re f
0.07 0.08 0.12 rg
BT
/F2 13 Tf
{self.margin_x + 10} {self.cursor_y} Td
({clean}) Tj
ET
0.88 0.88 0.9 RG
{self.margin_x} {self.cursor_y - 7} m {self.page_width - self.margin_x} {self.cursor_y - 7} l S
Q
"""
        self.current_page_stream.append(s)
        self.cursor_y -= 22

    def add_heading_2(self, title):
        self.check_space(30)
        clean = self.escape_text(title)
        s = f"""
q
0.18 0.2 0.26 rg
BT
/F2 10.5 Tf
{self.margin_x} {self.cursor_y} Td
({clean}) Tj
ET
Q
"""
        self.current_page_stream.append(s)
        self.cursor_y -= 15

    def add_paragraph(self, text, font="F1", size=8.8, leading=12.5, color=(0.18, 0.18, 0.22)):
        words = text.split(" ")
        lines = []
        cur_line = []
        max_chars = int(self.content_width / (size * 0.51))

        for w in words:
            if len(" ".join(cur_line + [w])) <= max_chars:
                cur_line.append(w)
            else:
                lines.append(" ".join(cur_line))
                cur_line = [w]
        if cur_line:
            lines.append(" ".join(cur_line))

        for line in lines:
            self.check_space(leading)
            clean = self.escape_text(line)
            s = f"""
q
{color[0]} {color[1]} {color[2]} rg
BT
/{font} {size} Tf
{self.margin_x} {self.cursor_y} Td
({clean}) Tj
ET
Q
"""
            self.current_page_stream.append(s)
            self.cursor_y -= leading

    def add_step_card(self, step_num, title, description, badge="AUTOMATED"):
        self.check_space(48)
        y = self.cursor_y - 42
        clean_title = self.escape_text(title)
        clean_desc = self.escape_text(description)
        clean_badge = self.escape_text(badge)
        s = f"""
q
0.98 0.98 0.99 rg
0.88 0.89 0.92 RG
{self.margin_x} {y} {self.content_width} 42 re B

0.55 0.1 0.1 rg
{self.margin_x + 8} {y + 11} 22 22 re f
1 1 1 rg
BT
/F2 11 Tf
{self.margin_x + 15} {y + 18} Td
({step_num}) Tj
ET

0.07 0.08 0.12 rg
BT
/F2 9.5 Tf
{self.margin_x + 38} {y + 24} Td
({clean_title}) Tj
ET

0.9 0.94 0.98 rg
0.3 0.55 0.85 RG
{self.page_width - self.margin_x - 85} {y + 21} 75 14 re B
0.1 0.35 0.65 rg
BT
/F2 7.5 Tf
{self.page_width - self.margin_x - 78} {y + 25.5} Td
({clean_badge}) Tj
ET

0.35 0.38 0.42 rg
BT
/F1 8.2 Tf
{self.margin_x + 38} {y + 10} Td
({clean_desc}) Tj
ET
Q
"""
        self.current_page_stream.append(s)
        self.cursor_y = y - 7

    def add_bullet(self, bold_prefix, text, size=8.5, leading=12.0):
        words = text.split(" ")
        lines = []
        cur_line = []
        max_chars = int((self.content_width - 16) / (size * 0.51))

        full_text = bold_prefix + " " + text
        for w in full_text.split(" "):
            if len(" ".join(cur_line + [w])) <= max_chars:
                cur_line.append(w)
            else:
                lines.append(" ".join(cur_line))
                cur_line = [w]
        if cur_line:
            lines.append(" ".join(cur_line))

        self.check_space(len(lines) * leading + 2)
        s = f"""
q
0.55 0.1 0.1 rg
{self.margin_x + 3} {self.cursor_y + 2.5} 3.5 3.5 re f
Q
"""
        self.current_page_stream.append(s)

        for idx, line in enumerate(lines):
            self.check_space(leading)
            clean_line = self.escape_text(line)
            font = "F2" if idx == 0 and len(lines) == 1 else "F1"
            s = f"""
q
0.18 0.2 0.24 rg
BT
/{font} {size} Tf
{self.margin_x + 12} {self.cursor_y} Td
({clean_line}) Tj
ET
Q
"""
            self.current_page_stream.append(s)
            self.cursor_y -= leading

    def add_callout(self, title, items, color_theme="crimson"):
        if color_theme == "crimson":
            bg_col = (0.99, 0.96, 0.96)
            border_col = (0.78, 0.25, 0.25)
            title_col = (0.55, 0.1, 0.1)
        elif color_theme == "emerald":
            bg_col = (0.95, 0.99, 0.96)
            border_col = (0.2, 0.65, 0.35)
            title_col = (0.05, 0.5, 0.25)
        else:
            bg_col = (0.96, 0.97, 0.99)
            border_col = (0.65, 0.72, 0.8)
            title_col = (0.18, 0.25, 0.38)

        total_lines = 1
        for it in items:
            total_lines += max(1, len(it) // 88 + 1)
        card_h = total_lines * 12 + 22

        self.check_space(card_h + 8)
        y = self.cursor_y - card_h + 8

        s = f"""
q
{bg_col[0]} {bg_col[1]} {bg_col[2]} rg
{border_col[0]} {border_col[1]} {border_col[2]} RG
{self.margin_x} {y} {self.content_width} {card_h} re B
{border_col[0]} {border_col[1]} {border_col[2]} rg
{self.margin_x} {y} 4 {card_h} re f
{title_col[0]} {title_col[1]} {title_col[2]} rg
BT
/F2 9 Tf
{self.margin_x + 14} {self.cursor_y - 6} Td
({self.escape_text(title)}) Tj
ET
Q
"""
        self.current_page_stream.append(s)
        self.cursor_y -= 18

        for it in items:
            words = it.split(" ")
            cur = []
            for w in words:
                if len(" ".join(cur + [w])) <= 92:
                    cur.append(w)
                else:
                    self.add_callout_line(" ".join(cur), indent=14)
                    cur = [w]
            if cur:
                self.add_callout_line(" ".join(cur), indent=14)
        self.cursor_y = y - 9

    def add_callout_line(self, line, indent=14):
        clean = self.escape_text(line)
        s = f"""
q
0.22 0.24 0.28 rg
BT
/F1 8.3 Tf
{self.margin_x + indent} {self.cursor_y} Td
({clean}) Tj
ET
Q
"""
        self.current_page_stream.append(s)
        self.cursor_y -= 11.5

    def add_table(self, headers, rows, col_widths=None):
        num_cols = len(headers)
        if not col_widths:
            col_widths = [self.content_width / num_cols] * num_cols

        row_h = 16
        table_h = (len(rows) + 1) * row_h + 6
        self.check_space(table_h)

        y_header = self.cursor_y - row_h
        s = f"""
q
0.1 0.12 0.18 rg
{self.margin_x} {y_header} {self.content_width} {row_h} re f
1 1 1 rg
"""
        cur_x = self.margin_x
        for i, h in enumerate(headers):
            s += f"""
BT
/F2 8.2 Tf
{cur_x + 6} {y_header + 4.5} Td
({self.escape_text(h)}) Tj
ET
"""
            cur_x += col_widths[i]
        s += "Q\n"
        self.current_page_stream.append(s)
        self.cursor_y -= row_h

        for r_idx, r in enumerate(rows):
            self.check_space(row_h)
            y_row = self.cursor_y - row_h
            bg = "0.98 0.98 0.99" if r_idx % 2 == 0 else "1 1 1"
            s = f"""
q
{bg} rg
{self.margin_x} {y_row} {self.content_width} {row_h} re f
0.88 0.88 0.9 RG
{self.margin_x} {y_row} {self.content_width} {row_h} re S
0.18 0.2 0.24 rg
"""
            cur_x = self.margin_x
            for c_idx, cell in enumerate(r):
                font_type = "F2" if c_idx == 0 else "F1"
                s += f"""
BT
/{font_type} 7.8 Tf
{cur_x + 6} {y_row + 4.5} Td
({self.escape_text(str(cell))}) Tj
ET
"""
                cur_x += col_widths[c_idx]
            s += "Q\n"
            self.current_page_stream.append(s)
            self.cursor_y -= row_h

        self.cursor_y -= 8

    def add_vspace(self, h):
        self.cursor_y -= h

    def build(self):
        if self.current_page_stream:
            self.end_page()

        total = len(self.pages)
        final_pages = []
        for idx, p in enumerate(self.pages):
            footer = self.draw_footer(idx + 1, total) if idx > 0 else ""
            final_pages.append(p + footer)

        objects = []
        objects.append("<< /Type /Catalog /Pages 2 0 R >>")
        kids = " ".join([f"{3 + i*2} 0 R" for i in range(total)])
        objects.append(f"<< /Type /Pages /Kids [{kids}] /Count {total} >>")

        fonts_dict = """<<
/F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
/F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
/F3 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>
/F4 << /Type /Font /Subtype /Type1 /BaseFont /Courier >>
/F5 << /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>
>>"""

        for i in range(total):
            page_obj_id = 3 + i * 2
            stream_obj_id = 4 + i * 2
            raw_stream = final_pages[i].encode("latin-1")
            compressed = zlib.compress(raw_stream)

            objects.append(f"""<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 {self.page_width:.2f} {self.page_height:.2f}]
/Resources << /Font {fonts_dict} >>
/Contents {stream_obj_id} 0 R
>>""")
            objects.append(f"""<<
/Length {len(compressed)}
/Filter /FlateDecode
>>
stream
""".encode("latin-1") + compressed + b"\nendstream")

        out = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
        offsets = []

        for idx, obj in enumerate(objects):
            offset = len(out)
            offsets.append(offset)
            obj_num = idx + 1
            if isinstance(obj, bytes):
                out.extend(f"{obj_num} 0 obj\n".encode("latin-1"))
                out.extend(obj)
                out.extend(b"\nendobj\n")
            else:
                out.extend(f"{obj_num} 0 obj\n{obj}\nendobj\n".encode("latin-1"))

        startxref = len(out)
        out.extend(f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode("latin-1"))
        for o in offsets:
            out.extend(f"{o:010d} 00000 n \n".encode("latin-1"))

        trailer = f"""trailer
<<
/Size {len(objects) + 1}
/Root 1 0 R
>>
startxref
{startxref}
%%EOF
"""
        out.extend(trailer.encode("latin-1"))

        with open(self.filename, "wb") as f:
            f.write(out)
        print(f"Successfully generated plain-English manual: {self.filename} ({len(out)} bytes, {total} pages)")


def generate_document():
    pdf = PDFDoc("/Users/dinez/Workspace/szToken-Dapp/docs/Swiz_Token_Protocol_Specification.pdf")
    
    # =============================================================
    # PAGE 1: COVER & EXECUTIVE SUMMARY
    # =============================================================
    pdf.add_cover()

    # =============================================================
    # PAGE 2: THE 5-STEP JOURNEY & USER LIFECYCLE
    # =============================================================
    pdf.start_page()
    pdf.draw_header()

    pdf.add_heading_1("SECTION 1: THE 5-STEP JOURNEY (HOW TO USE SWIZ)")
    pdf.add_paragraph(
        "Whether you are an everyday investor, community member, or team operator, here is the exact chronological path your funds take from initial deposit to guaranteed payouts."
    )
    pdf.add_vspace(8)

    pdf.add_step_card(
        "1",
        "Step 1: Deposit & Buy Your Staking Package",
        "Connect MetaMask or mobile wallet, enter your USDT amount, and confirm. Your SZ tokens are minted at the current price.",
        badge="USER ACTION"
    )

    pdf.add_step_card(
        "2",
        "Step 2: Tokens Enter the 20-Year Safe Vault",
        "Tokens sit safely in contract custody. Exactly 5% unlocks every 365 days across 20 annual slices. No dumping, no panic.",
        badge="CONTRACT CUSTODY"
    )

    pdf.add_step_card(
        "3",
        "Step 3: Price Climbs Automatically with Growth",
        "Every single package purchase increases the official reference price step by +2.33%. Your future value grows automatically.",
        badge="ALGORITHMIC GROWTH"
    )

    pdf.add_step_card(
        "4",
        "Step 4: Unlocked Tokens Enter the FIFO Line-Up",
        "When an annual slice reaches its unlock date, the contract automatically lines it up in a fair queue. Zero gas or claim clicks!",
        badge="100% AUTOMATED"
    )

    pdf.add_step_card(
        "5",
        "Step 5: Incoming Buyers Pay You Directly",
        "When any new buyer arrives, the contract sells your tokens to them: Year 1 pays 100% USDT Cash; Years 2-20 pay 100% ET tokens.",
        badge="DIRECT WALLET PAYOUT"
    )

    pdf.add_vspace(10)
    pdf.add_heading_2("FREQUENTLY ASKED QUESTIONS ABOUT THE JOURNEY")
    pdf.add_bullet(
        "Why can't I withdraw SZ tokens directly?",
        "SZ is engineered as a contract-custodied growth asset. If users could withdraw SZ to DEXs, traders could dump tokens and crash the price. Keeping tokens locked guarantees 100% backing and predictable appreciation."
    )
    pdf.add_bullet(
        "Do I need to pay gas fees or remember to click 'Claim'?",
        "No. You never have to click 'Claim'. The buyer who purchases tokens triggers the transaction and pays the blockchain gas fee. The smart contract deposits your payout directly into your wallet address."
    )
    pdf.add_bullet(
        "Can I track my packages live?",
        "Yes! Log in with your wallet at sztoken-dapp.vercel.app and open the Dashboard. You can see your active packages, exact unlock dates, and historical payouts in real time."
    )

    pdf.end_page()

    # =============================================================
    # PAGE 3: REAL-WORLD NUMERICAL EXAMPLE (ALICE & BOB STORY)
    # =============================================================
    pdf.start_page()
    pdf.draw_header()

    pdf.add_heading_1("SECTION 2: REAL-WORLD NUMERICAL EXAMPLE (THE ALICE STORY)")
    pdf.add_paragraph(
        "To see how the numbers work in practice, let us follow a concrete real-world example of an investor named Alice."
    )
    pdf.add_vspace(6)

    pdf.add_callout(
        "DAY 1: ALICE PURCHASES HER STAKING PACKAGE",
        [
            "Alice deposits $1,000 USDT when the protocol price is exactly $1.00 per SZ token.",
            "- Alice receives 1,000 SZ tokens placed into contract custody.",
            "- Her package is divided into 20 equal annual slices of 50 SZ tokens each (5% per year).",
            "- Her purchase increases the protocol volume counter, helping the reference price climb."
        ],
        color_theme="slate"
    )

    pdf.add_vspace(8)
    pdf.add_callout(
        "YEAR 1 ARRIVES: 100% CASH PAYOUT (USDT)",
        [
            "365 days pass. Alice's Slice #1 (50 SZ) reaches its unlock milestone and enters the FIFO queue.",
            "- In the meantime, hundreds of new users have bought packages, driving the price up to $2.00.",
            "- A new buyer, Bob, arrives to purchase SZ tokens.",
            "- The contract automatically matches Bob's order with Alice's unlocked 50 SZ tokens.",
            "- Sale Value = 50 SZ * $2.00 = $100.00.",
            "- RESULT: Alice receives $100.00 USDT cash directly into her wallet (UW).",
            "- Alice clicked nothing, paid zero gas, and already recovered 10% of her initial investment in Year 1!"
        ],
        color_theme="emerald"
    )

    pdf.add_vspace(8)
    pdf.add_callout(
        "YEAR 2 ARRIVES: 100% ECOSYSTEM TOKEN PAYOUT (ET)",
        [
            "730 days pass. Alice's Slice #2 (50 SZ) unlocks. By now, the protocol price has risen to $3.00.",
            "- A new buyer, Charlie, arrives to purchase SZ tokens.",
            "- The contract automatically matches Charlie's order with Alice's unlocked 50 SZ tokens.",
            "- Sale Value = 50 SZ * $3.00 = $150.00.",
            "- RESULT: Under Rule 24, Alice receives 150 Ecosystem Tokens (ET) minted directly to her wallet.",
            "- Charlie's $150 USDT goes to the company treasury (AW) to build platform utility and real-world adoption.",
            "- Alice receives 0 USDT and 100% ET, giving her valuable utility tokens without platform dilution."
        ],
        color_theme="crimson"
    )

    pdf.add_vspace(8)
    pdf.add_heading_2("YEARS 3 THROUGH 20: LONG-TERM HORIZON")
    pdf.add_paragraph(
        "For the remaining 18 years, Alice continues to receive 100% of her payout value in Ecosystem Tokens (ET) at steadily increasing reference prices (up to a maximum 100x cap of $100 per token). Her initial $1,000 package produces continuous annual payouts while protecting platform solvency."
    )

    pdf.end_page()

    # =============================================================
    # PAGE 4: RULES 21 TO 27 EXPLAINED IN PLAIN ENGLISH
    # =============================================================
    pdf.start_page()
    pdf.draw_header()

    pdf.add_heading_1("SECTION 3: FIFO BUYBACK RULES EXPLAINED (RULES 21-27)")
    pdf.add_paragraph(
        "Rules 21 through 27 govern how the smart contract matches orders, prices tokens, and splits payouts. Here is each rule explained in simple, plain English without developer jargon."
    )
    pdf.add_vspace(6)

    rules_plain = [
        ("Rule 21", "Existing Stakers Sell First", "When a new buyer arrives, the smart contract first checks if any existing stakers have unlocked tokens waiting to be sold. Only if no stakers are waiting does the contract mint from company treasury."),
        ("Rule 22", "Higher Price with 100x Cap", "Stakers are paid the current higher market price, but capped at a maximum of 100 times their entry price. For example, if you bought at $1.00, your maximum buyback rate is $100.00 per token."),
        ("Rule 23", "Year 1 = 100% Cash Back", "For your very first annual unlock (Year 1), you receive 100% of the proceeds in USDT cash directly in your wallet. Zero deductions, zero fees."),
        ("Rule 24", "Years 2-20 = 100% ET Rewards", "From Year 2 onward, stakers receive 100% of their payout in Ecosystem Tokens (ET). No USDT is paid to the user. The buyer's USDT goes to the company treasury to build platform utility."),
        ("Rule 25", "Fallback When Queue is Empty", "If a buyer wants to purchase SZ but no stakers have unlocked tokens ready for sale, the buyer's USDT goes directly to company treasury, and a brand-new 20-year package is created for them."),
        ("Rule 26", "Fair First-Come, First-Served", "Tokens are matched strictly by whichever tranche unlocked earliest. If two tranches unlocked on the exact same second, the earlier package ID is served first. No front-running!"),
        ("Rule 27", "Partial Order Matching Allowed", "If a buyer only wants 20 tokens but your tranche has 50 tokens, you sell 20 tokens immediately and keep your place at the front of the line for the remaining 30 tokens.")
    ]
    pdf.add_table(["Rule #", "Plain-English Name", "What It Means for You"], rules_plain, col_widths=[50, 130, 335])

    pdf.add_vspace(10)
    pdf.add_heading_2("YEAR 1 VS. YEARS 2-20 PAYOUT COMPARISON TABLE")

    comparison = [
        ("Payout Asset to User", "100% USDT (Cash)", "100% Ecosystem Token (ET)"),
        ("USDT to User Wallet?", "YES - 100% of matched value", "NO - Zero USDT to user"),
        ("ET to User Wallet?", "NO - Zero ET in Year 1", "YES - 100% of matched value in ET"),
        ("USDT to Company Treasury?", "NO - Treasury receives $0", "YES - 100% of buyer's USDT to treasury"),
        ("Purpose of Distribution", "Provides fast cash return of initial principal", "Rewards stakers with utility; funds ecosystem")
    ]
    pdf.add_table(["Feature / Metric", "Year 1 Buyback Payout", "Years 2-20 Buyback Payout"], comparison, col_widths=[145, 185, 185])

    pdf.end_page()

    # =============================================================
    # PAGE 5: INDIVIDUAL MODULE WORKFLOWS (MODULES 1 TO 4)
    # =============================================================
    pdf.start_page()
    pdf.draw_header()

    pdf.add_heading_1("SECTION 4: INDIVIDUAL MODULE WORKFLOWS (PART 1)")
    pdf.add_paragraph(
        "The Swiz DApp is made of specialized building blocks (modules). Here is what each module does and how they work together."
    )
    pdf.add_vspace(6)

    pdf.add_heading_2("MODULE 1: THE BUY GATEWAY (BuyTokensSection.tsx & SZToken.sol)")
    pdf.add_bullet(
        "What it does:",
        "The user-friendly store where anyone can purchase 20-year progressive unlock packages using USDT.c."
    )
    pdf.add_bullet(
        "User experience:",
        "You type in your dollar amount (e.g. $1,000). The screen shows you the exact reference price, how many SZ tokens you will receive in custody, and your 20-year schedule. You click 'Purchase', your wallet asks for confirmation, and your package is created."
    )

    pdf.add_vspace(8)
    pdf.add_heading_2("MODULE 2: THE DYNAMIC PRICE ENGINE (_calculatePrice)")
    pdf.add_bullet(
        "What it does:",
        "The automated price calculator that guarantees your tokens become more valuable as the platform grows."
    )
    pdf.add_bullet(
        "How it works:",
        "Every 1,000 packages created OR every $100,000 in volume steps the price up by +2.33% compounded. Because it is computed on-chain with mathematical formulas, there are no outside stock feeds or oracle feeds that hackers can manipulate."
    )

    pdf.add_vspace(8)
    pdf.add_heading_2("MODULE 3: THE 20-YEAR PROGRESSIVE VAULT (Linear Custody)")
    pdf.add_bullet(
        "What it does:",
        "The digital safe that holds all SZ tokens and releases 5% every 365 days."
    )
    pdf.add_bullet(
        "Why it matters:",
        "Unlike speculative crypto projects where early investors dump 100% of their tokens on Day 1, Swiz enforces a 20-year horizon. Every year for 20 years, a fresh 5% tranche becomes eligible for buybacks."
    )

    pdf.add_vspace(8)
    pdf.add_heading_2("MODULE 4: THE LIVE FIFO MATCHING CASHIER (_match)")
    pdf.add_bullet(
        "What it does:",
        "The automated cashier that matches incoming buyers with stakers waiting in line."
    )
    pdf.add_bullet(
        "How it works:",
        "It maintains an on-chain queue where stakers with the oldest unlock dates stand at the front. When a buyer submits USDT, the cashier takes the buyer's payment, buys the staker's tokens, and transfers cash or ET directly into the staker's wallet."
    )

    pdf.end_page()

    # =============================================================
    # PAGE 6: MODULES 5 TO 7 & SECURITY PROTECTIONS
    # =============================================================
    pdf.start_page()
    pdf.draw_header()

    pdf.add_heading_1("SECTION 4: INDIVIDUAL MODULE WORKFLOWS (PART 2)")

    pdf.add_heading_2("MODULE 5: THE CROSS-CHAIN USDT BRIDGE (DepositPage.tsx)")
    pdf.add_bullet(
        "What it does:",
        "Allows users to bring their USDT from Ethereum Sepolia or Binance Smart Chain (BSC) into the Swiz network."
    )
    pdf.add_bullet(
        "How it works:",
        "You deposit your source USDT into the adapter contract on Ethereum or BSC. The funds go directly into company treasury custody. The bridge wrapper on Polygon Amoy verifies the receipt and mints 1:1 destination USDT.c to your wallet."
    )

    pdf.add_vspace(8)
    pdf.add_heading_2("MODULE 6: THE SECONDARY BACKUP WALLET (Lost Key Recovery)")
    pdf.add_bullet(
        "What it does:",
        "An insurance policy against lost passwords, damaged hardware, or hacked seed phrases."
    )
    pdf.add_bullet(
        "How it works:",
        "Every user can connect a secondary recovery wallet address in their Dashboard. If your primary wallet is ever lost or compromised, protocol administration can execute replaceWallet(), which securely migrates all your 20-year packages and balances to your backup address while freezing the compromised wallet."
    )

    pdf.add_vspace(8)
    pdf.add_heading_2("MODULE 7: ADMIN TREASURY & PROTOCOL CONTROLS")
    pdf.add_bullet(
        "What it does:",
        "Company safety controls and liquidity management."
    )
    pdf.add_bullet(
        "How it works:",
        "The admin can deposit corporate funds into the buyback engine to buy unlocked inventory from stakers and retire tokens into treasury. The admin also holds pause powers to freeze malicious addresses without disrupting normal community members."
    )

    pdf.add_vspace(12)
    pdf.add_callout(
        "SECURITY ASSURANCES SUMMARY",
        [
            "- 100% Backed: Every package corresponds to real collateral and pre-minted supply in contract custody.",
            "- Zero Dust Loss: All fractional cents from division are captured and retained in treasury, preventing rounding drain attacks.",
            "- Complete Transparency: Every transaction, tranche unlock, and buyback event is permanently recorded on Polygon Amoy explorer.",
            "- Elderly & User-Friendly Design: High-contrast typography, large buttons, and zero-claim automated execution."
        ],
        color_theme="emerald"
    )

    pdf.end_page()
    pdf.build()

if __name__ == "__main__":
    generate_document()
