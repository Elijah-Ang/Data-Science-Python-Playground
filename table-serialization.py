def _serialize_table_cell(value):
    if isinstance(value, (pd.Timestamp,)):
        return value.isoformat()
    missing = pd.isna(value)
    if isinstance(missing, (bool, np.bool_)) and missing:
        return None
    return value.item() if hasattr(value, "item") else value


def serialize_dataframe_result(frame, max_rows=50, max_columns=20):
    if isinstance(frame, pd.Series):
        frame = frame.rename(frame.name if frame.name is not None else "value").to_frame()
    shown = frame.head(max_rows).iloc[:, :max_columns]
    index = shown.index
    is_default_range = (
        isinstance(index, pd.RangeIndex)
        and index.name is None
        and index.start == 0
        and index.step == 1
    )
    if is_default_range:
        display = shown.reset_index(drop=True)
    else:
        index_frame = index.to_frame(index=False)
        index_names = list(index.names) if isinstance(index, pd.MultiIndex) else [index.name]
        index_columns = [
            str(name) if name is not None else ("index" if position == 0 else f"index_{position}")
            for position, name in enumerate(index_names)
        ]
        index_frame.columns = index_columns
        display = pd.concat(
            [index_frame.reset_index(drop=True), shown.reset_index(drop=True)],
            axis=1,
        )
    return {
        "columns": [str(column) for column in display.columns],
        "rows": [[_serialize_table_cell(value) for value in row] for row in display.to_numpy().tolist()],
        "rowCount": int(len(frame)),
        "columnCount": int(len(frame.columns)),
        "indexColumns": 0 if is_default_range else index.nlevels,
        "truncated": len(frame) > len(shown) or len(frame.columns) > len(shown.columns),
    }

# Bounded capture used by the ML worker before serializing a result.
import io as _stream_io
class BoundedOutputStream(_stream_io.StringIO):
    def write(self, text):
        remaining = 20000 - self.tell()
        if remaining > 0:
            super().write(text[:remaining])
            if len(text) > remaining:
                super().write(' [Output truncated at 20,000 characters]')
        return len(text)
