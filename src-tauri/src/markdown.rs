use pulldown_cmark::{html, CodeBlockKind, Event, Options, Parser, Tag, TagEnd};
use serde::Serialize;
use std::fs;
use syntect::highlighting::{Theme, ThemeSet};
use syntect::html::highlighted_html_for_string;
use syntect::parsing::SyntaxSet;

const LARGE_FILE_THRESHOLD_BYTES: usize = 1024 * 1024;

#[derive(Serialize, Clone)]
pub struct RenderResult {
    pub html: String,
    pub words: usize,
    pub chars: usize,
    pub tokens: usize,
}

fn estimate_tokens(text: &str) -> usize {
    // Anthropic's heuristic: ~3.5 English characters per token
    ((text.len() as f64) / 3.5).round() as usize
}

fn count_words(text: &str) -> usize {
    text.split_whitespace().count()
}

pub fn render_markdown(path: &str) -> Result<RenderResult, String> {
    let bytes = fs::read(path).map_err(|err| format!("Failed to read file '{}': {}", path, err))?;
    let skip_syntax_highlighting = bytes.len() > LARGE_FILE_THRESHOLD_BYTES;

    let markdown = match String::from_utf8(bytes) {
        Ok(content) => content,
        Err(_) => {
            let escaped_path = escape_html(path);
            return Ok(RenderResult {
                html: format!(
                    "<p class=\"error\">Could not render <code>{}</code>: file is not valid UTF-8.</p>",
                    escaped_path
                ),
                words: 0,
                chars: 0,
                tokens: 0,
            });
        }
    };

    if markdown.trim().is_empty() {
        return Ok(RenderResult {
            html: "<p class=\"muted\">Empty file</p>".to_string(),
            words: 0,
            chars: 0,
            tokens: 0,
        });
    }

    let words = count_words(&markdown);
    let chars = markdown.len();
    let tokens = estimate_tokens(&markdown);

    let mut options = Options::empty();
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TASKLISTS);
    options.insert(Options::ENABLE_FOOTNOTES);

    let mut rendered_html = String::new();
    let parser = Parser::new_ext(&markdown, options);

    let syntax_set = if skip_syntax_highlighting {
        None
    } else {
        Some(SyntaxSet::load_defaults_newlines())
    };
    let theme = if skip_syntax_highlighting {
        None
    } else {
        load_theme()
    };

    let mut events = parser.into_iter();
    while let Some(event) = events.next() {
        match event {
            Event::Start(Tag::CodeBlock(kind)) => {
                let mut code = String::new();
                for inner_event in events.by_ref() {
                    match inner_event {
                        Event::End(TagEnd::CodeBlock) => break,
                        Event::Text(text) | Event::Code(text) | Event::Html(text) => {
                            code.push_str(&text);
                        }
                        Event::SoftBreak | Event::HardBreak => code.push('\n'),
                        _ => {}
                    }
                }

                let language = match kind {
                    CodeBlockKind::Fenced(info) => parse_language(&info),
                    CodeBlockKind::Indented => String::new(),
                };

                let highlighted = match (&syntax_set, &theme) {
                    (Some(set), Some(theme)) => {
                        highlight_code_block(set, theme, &code, &language)
                    }
                    _ => plain_code_block(&code),
                };
                rendered_html.push_str(&highlighted);
            }
            other => html::push_html(&mut rendered_html, std::iter::once(other)),
        }
    }

    Ok(RenderResult {
        html: format!(
            "<div data-skip-syntax-highlighting=\"{}\">{}</div>",
            skip_syntax_highlighting, rendered_html
        ),
        words,
        chars,
        tokens,
    })
}

fn load_theme() -> Option<Theme> {
    let theme_set = ThemeSet::load_defaults();
    theme_set
        .themes
        .get("base16-ocean.dark")
        .cloned()
        .or_else(|| theme_set.themes.values().next().cloned())
}

fn parse_language(info: &str) -> String {
    info.split_whitespace()
        .next()
        .map(|token| token.split(',').next().unwrap_or(token).to_string())
        .unwrap_or_default()
}

fn highlight_code_block(
    syntax_set: &SyntaxSet,
    theme: &Theme,
    code: &str,
    language: &str,
) -> String {
    let syntax = syntax_set
        .find_syntax_by_token(language)
        .unwrap_or_else(|| syntax_set.find_syntax_plain_text());

    match highlighted_html_for_string(code, syntax_set, syntax, theme) {
        Ok(html) => html,
        Err(_) => plain_code_block(code),
    }
}

fn plain_code_block(code: &str) -> String {
    format!("<pre><code>{}</code></pre>", escape_html(code))
}

fn escape_html(input: &str) -> String {
    input
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#39;")
}
