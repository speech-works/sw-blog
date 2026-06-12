import type { StructureBuilder, StructureResolver } from "sanity/structure";
import { DocumentTextIcon, UserIcon } from "@sanity/icons";
import { isEditorUser } from "../actions/workflowActions";

function statusItem(S: StructureBuilder, title: string, value: string) {
  return S.listItem()
    .title(title)
    .child(
      S.documentList()
        .title(title)
        .filter('_type == "post" && workflowStatus == $value')
        .params({ value }),
    );
}

// Authors see only the posts they created ("My posts"). Editors see everything,
// grouped by approval status. NOTE: this is a soft view filter, not hard isolation
// (an author could still find others' posts via global search) -- the accepted
// free-tier trade-off. Hard isolation needs paid custom roles.
export const deskStructure: StructureResolver = (S, context) => {
  const userId = context.currentUser?.id ?? "";
  const isEditor = isEditorUser(context.currentUser);

  const myPosts = S.listItem()
    .title("My posts")
    .icon(DocumentTextIcon)
    .child(
      S.documentList()
        .title("My posts")
        .filter('_type == "post" && owner == $userId')
        .params({ userId }),
    );

  const allAuthors = S.documentTypeListItem("author")
    .title("Authors")
    .icon(UserIcon);

  const myProfile = S.listItem()
    .title("My profile")
    .icon(UserIcon)
    .child(
      S.documentList()
        .title("My profile")
        .filter('_type == "author" && owner == $userId')
        .params({ userId }),
    );

  if (!isEditor) {
    return S.list().title("Content").items([myPosts, S.divider(), myProfile]);
  }

  return S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Posts by status")
        .icon(DocumentTextIcon)
        .child(
          S.list()
            .title("Posts by status")
            .items([
              statusItem(S, "Drafts", "draft"),
              statusItem(S, "In review", "inReview"),
              statusItem(S, "Approved", "approved"),
              statusItem(S, "Published", "published"),
            ]),
        ),
      S.documentTypeListItem("post").title("All posts").icon(DocumentTextIcon),
      myPosts,
      S.divider(),
      allAuthors,
    ]);
};
