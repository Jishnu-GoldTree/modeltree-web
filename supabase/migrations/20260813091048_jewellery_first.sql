-- Jewellery leads the print taxonomy.
--
-- GoldTree is a gold trading company: jewellery is the core inventory, not one
-- category among eighteen. Reordering here rather than in the components keeps
-- the client able to change it later without a deploy.

update categories set position = 0 where slug = 'jewelry';
update categories set position = 1 where slug = 'art';
update categories set position = 2 where slug = 'games-toys';

-- The in-house library is jewellery for casting, so give it the label buyers
-- searching for it would use.
update categories set label = 'Jewellery' where slug = 'jewelry';
