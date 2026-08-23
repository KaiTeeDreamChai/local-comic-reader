import re
import os

with open('backend/routers/library.py', 'r') as f:
    content = f.read()

# We need to replace the search matching logic in search_library
# The existing logic is:
# if query in d.lower():
# ...
# if query in f.lower():

fuzzy_match_func = """
def fuzzy_match(query: str, target: str) -> bool:
    q = query.lower()
    t = target.lower()
    if q in t: return True
    q_words = q.split()
    if all(word in t for word in q_words): return True
    import re
    q_clean = re.sub(r'[\W_]+', '', q)
    t_clean = re.sub(r'[\W_]+', '', t)
    if q_clean and q_clean in t_clean: return True
    if len(q_clean) >= 3:
        it = iter(t_clean)
        if all(c in it for c in q_clean): return True
    return False

@router.get("/api/library/search")
"""

content = content.replace('@router.get("/api/library/search")', fuzzy_match_func)
content = content.replace('if query in d.lower():', 'if fuzzy_match(query, d):')
content = content.replace('if query in f.lower():', 'if fuzzy_match(query, f):')

with open('backend/routers/library.py', 'w') as f:
    f.write(content)
