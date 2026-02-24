use pulldown_cmark::{html, Options, Parser};
use std::fs;

const LARGE_FILE_THRESHOLD_BYTES: usize = 1024 * 1024;

pub fn render_markdown(path: &str) -> Result<String, String> {
    let bytes = fs::read(path).map_err(|err| format!("Failed to read file '{}': {}", path, err))?;
    let skip_syntax_highlighting = bytes.len() > LARGE_FILE_THRESHOLD_BYTES;

    let markdown = match String::from_utf8(bytes) {
        Ok(content) => content,
        Err(_) => {
            let escaped_path = escape_html(path);
            return Ok(format!(
                "<p class=\"error\">Could not render <code>{}</code>: file is not valid UTF-8.</p>",
                escaped_path
            ));
        }
    };

    if markdown.trim().is_empty() {
        return Ok("<p class=\"muted\">Empty file</p>".to_string());
    }

    let mut options = Options::empty();
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TASKLISTS);
    options.insert(Options::ENABLE_FOOTNOTES);

    let parser = Parser::new_ext(&markdown, options);
    let mut rendered_html = String::new();
    html::push_html(&mut rendered_html, parser);

    Ok(format!(
        "<div data-skip-syntax-highlighting=\"{}\">{}</div>",
        skip_syntax_highlighting, rendered_html
    ))
}

fn escape_html(input: &str) -> String {
    input
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#39;")
}
