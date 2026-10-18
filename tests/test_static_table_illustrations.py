"""Execute the exact Python printed above the native introductory tables."""

import ast
from html.parser import HTMLParser
import json
from pathlib import Path
import subprocess
import tempfile

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
IDS = ["I01", "I01CSV", "I03", "I04", "I05", "I06S", "I17", "I19A", "W13", "W18"]
script = """
const c=require('./foundations/curriculum.js'),t=require('./foundations/teaching.js');
globalThis.FoundationVisuals=require('./foundations/visuals.js');
console.log(JSON.stringify(JSON.parse(process.argv[1]).map(id=>{
 const l=c.lessons.find(l=>l.id===id);return {id,html:t.intro(c,l,l.rounds[0])};
})));
"""


class ReadTables(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.tables, self.pres = [], []
        self.table = self.cell = self.pre = None
        self.scalar = ""
        self.in_output = False
        self.in_head = False
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        if tag == "table":
            self.table = dict(headers=[], rows=[])
        elif tag == "thead":
            self.in_head = True
        elif tag == "tr":
            self.row = []
        elif tag in ("td", "th"):
            self.cell = ""
        elif tag == "pre":
            self.pre = ""
        elif tag == "output":
            self.in_output = True

    def handle_data(self, text):
        if self.cell is not None:
            self.cell += text
        if self.pre is not None:
            self.pre += text
        if self.in_output:
            self.scalar += text

    def handle_endtag(self, tag):
        if tag in ("td", "th") and self.cell is not None:
            self.row.append(self.cell.strip())
            self.cell = None
        elif tag == "tr" and self.table is not None:
            if self.in_head:
                self.table["headers"] = self.row
            else:
                self.table["rows"].append(self.row)
        elif tag == "thead":
            self.in_head = False
        elif tag == "table":
            self.tables.append(self.table)
            self.table = None
        elif tag == "pre":
            self.pres.append(self.pre)
            self.pre = None
        elif tag == "output":
            self.in_output = False


def value(text):
    try:
        return ast.literal_eval(text)
    except (ValueError, SyntaxError):
        return text


records = []
for case in json.loads(
    subprocess.check_output(["node", "-e", script, json.dumps(IDS)], cwd=ROOT)
):
    parsed = ReadTables(case["html"])
    tables = parsed.tables
    source = tables[0]
    rows = [[value(n) for n in row] for row in source["rows"]]
    namespace = dict(pd=pd, df=pd.DataFrame(rows, columns=source["headers"]))
    code = parsed.pres[0]
    if case["id"] == "I06S":
        namespace["readings"] = pd.Series(
            [r[2] for r in rows], index=[r[1] for r in rows]
        )
    if case["id"] == "I19A":
        namespace["means"] = pd.Series({r[0]: r[1] for r in rows})
        namespace["counts"] = pd.Series({r[0]: value(r[1]) for r in tables[1]["rows"]})
    with tempfile.TemporaryDirectory() as directory:
        if case["id"] == "I01CSV":
            csv = Path(directory) / "tiny.csv"
            csv.write_text(parsed.pres[1])
            code = code.replace('"tiny.csv"', repr(str(csv)))
        tree = ast.parse(code)
        if len(tree.body) == 1 and isinstance(tree.body[0], ast.Expr):
            result = eval(
                compile(ast.Expression(tree.body[0].value), "<illustration>", "eval"),
                namespace,
            )
        else:
            exec(code, namespace)
            result = namespace["df"]
    if isinstance(result, pd.DataFrame):
        target = tables[-1] if case["id"] in ("I19A", "W13", "W18") else tables[0]
        expected = [[value(n) for n in row] for row in target["rows"]]
        if case["id"] == "I19A":
            assert [[index, *row] for index, *row in result.itertuples()] == expected
        else:
            assert result.values.tolist() == expected, case["id"]
        if case["id"] == "W13":
            assert str(result.flavour.dtype) == "category"
    elif case["id"] == "I05":
        assert [[name, str(dtype)] for name, dtype in result.items()] == tables[-1][
            "rows"
        ]
    elif case["id"] == "I17":
        assert result.tolist() == [value(row[1]) for row in tables[-1]["rows"]]
    else:
        assert result == ast.literal_eval(parsed.scalar), case["id"]
    records.append(dict(id=case["id"], nativePython="passed"))
print(
    json.dumps(
        dict(passed=True, staticExamples=len(records), records=records), indent=2
    )
)
