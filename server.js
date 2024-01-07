import { createServer } from "http";
import { readFile } from "fs/promises";
import escapeHtml from "escape-html";

createServer(async (req, res) => {
  const author = "Jae Doe";
  const postContent = await readFile("./posts/hello-world.txt", "utf8");
  sendHTML(res, <BlogPostPage postContent={postContent} author={author} />);
}).listen(3000);

function renderJSXToHTML(jsx) {
  if (typeof jsx === "string" || typeof jsx === "number") {
    // This is a string. Escape it and put it into HTML directly.
    return escapeHtml(jsx);
  } else if (jsx == null || typeof jsx === "boolean") {
    // This is an empty node. Don't emit anything in HTML for it.
    return "";
  } else if (Array.isArray(jsx)) {
    // This is an array of nodes. Render each into HTML and concatenate.
    return jsx.map((child) => renderJSXToHTML(child)).join("");
  } else if (typeof jsx === "object") {
    // Check if this object is a React JSX element (e.g. <div />).
    if (jsx.$$typeof === Symbol.for("react.element")) {
      if (typeof jsx.type === "string") {
        // Turn it into an an HTML tag.
        let html = "<" + jsx.type;
        for (const propName in jsx.props) {
          if (jsx.props.hasOwnProperty(propName) && propName !== "children") {
            html += " ";
            html += propName;
            html += "=";
            html += escapeHtml(jsx.props[propName]);
          }
        }
        html += ">";
        html += renderJSXToHTML(jsx.props.children);
        html += "</" + jsx.type + ">";
        return html;
      } else if (typeof jsx.type === "function") {
        // Is it a component like <BlogPostPage>?
        // Call the component with its props, and turn its returned JSX into HTML.
        const Component = jsx.type;
        const props = jsx.props;
        const returnedJsx = Component(props);
        return renderJSXToHTML(returnedJsx);
      } else throw new Error("Not implemented.");
    } else throw new Error("Cannot render an object.");
  } else throw new Error("Not implemented.");
}

function BlogPostPage({ postContent, author }) {
  return (
    <html>
      <head>
        <title>My blog</title>
      </head>
      <body>
        <nav>
          <a href="/">Home</a>
          <hr />
        </nav>
        <article>{postContent}</article>
        <Footer author={author} />
      </body>
    </html>
  );
}

function Footer({ author }) {
  return (
    <footer>
      <hr />
      <p>
        <i>
          (c) {author} {new Date().getFullYear()}
        </i>
      </p>
    </footer>
  );
}

function sendHTML(res, jsx) {
  const html = renderJSXToHTML(jsx);
  console.log({ html });
  res.setHeader("Content-Type", "text/html");
  res.end(html);
}
