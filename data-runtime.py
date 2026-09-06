import io, json, ast, base64, contextlib, traceback
from datetime import date, datetime
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
sns.set_theme(style='whitegrid')
def _notebook_show(*args, **kwargs):
    for _figure_number in plt.get_fignums():
        plt.figure(_figure_number).canvas.draw()
    return None
plt.show = _notebook_show
original_csv = ''
separator = ','
df = pd.DataFrame()
original_df = pd.DataFrame()
user_namespace = {}

def _json_scalar(value):
    if value is None:
        return None
    if isinstance(value, (np.integer, np.floating, np.bool_)):
        return value.item()
    if isinstance(value, (pd.Timestamp, datetime, date)):
        return value.isoformat()
    try:
        missing = pd.isna(value)
        if isinstance(missing, (bool, np.bool_)) and missing:
            return None
    except Exception:
        pass
    if isinstance(value, (str, int, float, bool)):
        return value
    return str(value)

def _frame_payload(frame, limit=18, col_limit=14):
    if not isinstance(frame, (pd.DataFrame, pd.Series)):
        return None
    return serialize_dataframe_result(frame, max_rows=limit, max_columns=col_limit)

def _state_payload():
    frame = user_namespace.get('df')
    if not isinstance(frame, pd.DataFrame):
        return {'rows': 0, 'cols': 0, 'columns': [], 'changed': True, 'invalid': True}
    return {'rows': int(len(frame)), 'cols': int(len(frame.columns)), 'columns': [str(column) for column in frame.columns], 'changed': not frame.equals(original_df), 'originalRows': int(len(original_df))}

def initialize(csv_value, sep_value):
    global original_csv, separator, df, original_df
    original_csv = csv_value
    separator = sep_value or ','
    df = pd.read_csv(io.StringIO(original_csv), sep=separator, engine='python')
    original_df = df.copy(deep=True)
    reset_frame()

def reset_frame():
    global user_namespace
    user_namespace = {'__builtins__': __builtins__, 'pd': pd, 'np': np, 'plt': plt, 'sns': sns, 'df': original_df.copy(deep=True), 'original_df': original_df.copy(deep=True)}

def profile_payload():
    df = user_namespace.get('df')
    if not isinstance(df, pd.DataFrame):
        return {'state': _state_payload(), 'numeric': [], 'categorical': [], 'dtypes': {}, 'preview': None}
    numeric = [str(column) for column in df.select_dtypes(include='number').columns]
    categorical = [str(column) for column in df.select_dtypes(include=['object', 'category', 'bool']).columns]
    dtypes = {str(column): str(dtype) for column, dtype in df.dtypes.items()}
    return {'state': _state_payload(), 'numeric': numeric, 'categorical': categorical, 'dtypes': dtypes, 'preview': _frame_payload(df, 7, 7)}

def export_csv():
    return user_namespace['df'].to_csv(index=False)

class BoundedStream(io.StringIO):
    def __init__(self, events=None, kind='stdout'):
        super().__init__()
        self.events, self.kind = events, kind

    def write(self, text):
        remaining = 20000 - self.tell()
        if remaining > 0:
            if self.events is not None:
                part = text[:remaining] + ('\n[Output truncated]' if len(text) > remaining else '')
                if self.events and self.kind in self.events[-1]:
                    self.events[-1][self.kind] += part
                else:
                    self.events.append({self.kind: part})
            super().write(text[:remaining])
            if len(text) > remaining:
                super().write('\n[Output truncated at 20,000 characters]')
        return len(text)

def execute_cell(code):
    events = []
    stdout = BoundedStream(events)
    stderr = BoundedStream(events, 'stderr')
    charts = []
    namespace = user_namespace
    namespace['original_df'] = original_df.copy(deep=True)
    def display(value, *args, **kwargs):
        payload = _frame_payload(value)
        events.append({'table': payload} if payload is not None else {'value': str(_json_scalar(value))[:20000]})
    def capture_figures(*args, **kwargs):
        for figure_number in plt.get_fignums():
            figure = plt.figure(figure_number)
            buffer = io.BytesIO()
            figure.savefig(buffer, format='png', dpi=130, bbox_inches='tight', facecolor='#fffaf0')
            charts.append('data:image/png;base64,' + base64.b64encode(buffer.getvalue()).decode('ascii'))
            events.append({'chart': charts[-1], 'title': ' · '.join(ax.get_title() for ax in figure.axes if ax.get_title()), 'chartData': _frame_payload(namespace.get('plot'))})
        plt.close('all')
    previous_show = plt.show
    plt.show = capture_figures
    namespace['display'] = display
    namespace['_cell_result'] = None
    try:
        tree = ast.parse(code, mode='exec')
        if tree.body and isinstance(tree.body[-1], ast.Expr):
            tree.body[-1] = ast.Assign(targets=[ast.Name(id='_cell_result', ctx=ast.Store())], value=tree.body[-1].value)
            ast.fix_missing_locations(tree)
        with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
            exec(compile(tree, '<notebook-cell>', 'exec'), namespace, namespace)
        value = namespace.get('_cell_result')
        if value is not None:
            display(value)
        table = _frame_payload(value) if isinstance(value, (pd.DataFrame, pd.Series)) else None
        text_value = '' if table is not None or value is None else str(_json_scalar(value))[:20000]
        capture_figures()
        return {'status': 'ok', 'events': events, 'table': table, 'value': text_value, 'stdout': stdout.getvalue(), 'stderr': stderr.getvalue(), 'charts': charts, 'state': _state_payload(), 'profile': profile_payload()}
    except Exception:
        return {'status': 'error', 'table': None, 'value': '', 'stdout': stdout.getvalue(), 'stderr': stderr.getvalue(), 'charts': [], 'error': traceback.format_exc(), 'state': _state_payload(), 'profile': profile_payload()}
    finally:
        plt.show = previous_show
        plt.close('all')
